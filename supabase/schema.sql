-- =========================================================
-- BARBING APP — SUPABASE SCHEMA
-- Roles: super_admin | admin (business owner) | barber | customer
-- =========================================================

-- ---------- EXTENSIONS ----------
create extension if not exists "uuid-ossp";

-- =========================================================
-- 1. PROFILES  (1-1 with auth.users, holds role + basic info)
-- =========================================================
create type user_role as enum ('super_admin', 'admin', 'barber', 'manager', 'customer');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  full_name text not null,
  phone text,
  avatar_url text,
  -- barbers belong to exactly one business
  business_id uuid,
  is_active boolean not null default true,
  created_by uuid references auth.users(id), -- who onboarded this user (owner/barber)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Note: businesses table is created below; we ALTER the FK after (circular ref handling)

-- =========================================================
-- 2. BUSINESSES  (each business = one barbing shop, owned by an admin)
-- =========================================================
create table businesses (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text unique not null,
  address text,
  phone text,
  paystack_subaccount_code text, -- optional: for split payments at Paystack level
  default_price numeric(12,2) not null default 3000.00, -- standard haircut price (owner-editable)
  commission_rate numeric(5,2) not null default 15.00, -- platform % (overridable by super_admin)
  loyalty_interval int not null default 3, -- every N paid transactions => 1 free ticket (owner-editable)
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table profiles
  add constraint profiles_business_fk foreign key (business_id) references businesses(id) on delete set null;

-- =========================================================
-- 3. BUSINESS_CUSTOMERS  (join table: a customer can belong to many businesses)
--    tracks per-business loyalty transaction count
-- =========================================================
create table business_customers (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  onboarded_by uuid references auth.users(id), -- owner or barber who added them
  paid_transaction_count int not null default 0, -- resets every 3 (or just counts total, we use modulo)
  free_tickets_earned int not null default 0,
  created_at timestamptz not null default now(),
  unique (business_id, customer_id)
);

-- =========================================================
-- 4. TICKETS
-- =========================================================
create type ticket_status as enum ('pending', 'approved', 'completed', 'cancelled');

create table tickets (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  customer_id uuid not null references auth.users(id),
  barber_id uuid references auth.users(id), -- assigned/approving barber
  status ticket_status not null default 'pending',
  is_free boolean not null default false,
  amount numeric(12,2) not null default 0, -- 0 if free ticket
  transaction_id uuid, -- linked after payment (nullable for free tickets with no payment)
  submitted_at timestamptz, -- when customer clicked "submit ticket"
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 5. TRANSACTIONS  (Paystack payments)
-- =========================================================
create type transaction_status as enum ('pending', 'success', 'failed');

create table transactions (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  customer_id uuid not null references auth.users(id),
  ticket_id uuid references tickets(id),
  amount numeric(12,2) not null,
  platform_fee numeric(12,2) not null,   -- 15% (or business.commission_rate)
  business_amount numeric(12,2) not null, -- 85%
  paystack_reference text unique not null,
  status transaction_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table tickets
  add constraint tickets_transaction_fk foreign key (transaction_id) references transactions(id);

-- =========================================================
-- 6. EXPENSES  (submitted by barber or owner, approved by owner)
-- =========================================================
create type expense_status as enum ('pending', 'approved', 'rejected');

create table expenses (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  submitted_by uuid not null references auth.users(id),
  category text not null default 'general',
  description text not null,
  amount numeric(12,2) not null,
  status expense_status not null default 'pending',
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 7. PLATFORM SETTINGS (super admin controlled, single row)
-- =========================================================
create table platform_settings (
  id int primary key default 1,
  default_commission_rate numeric(5,2) not null default 15.00,
  loyalty_interval int not null default 3, -- every N paid transactions => 1 free ticket
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);
insert into platform_settings (id) values (1);

-- =========================================================
-- TRIGGERS
-- =========================================================

-- 7a. Auto-update updated_at on profiles
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
before update on profiles
for each row execute function set_updated_at();

-- 7b. When a transaction becomes 'success': generate a ticket + apply loyalty logic
create or replace function handle_successful_transaction() returns trigger as $$
declare
  v_loyalty_interval int;
  v_bc business_customers%rowtype;
  v_new_count int;
begin
  if new.status = 'success' and (old.status is distinct from 'success') then

    -- ensure business_customers row exists
    insert into business_customers (business_id, customer_id)
    values (new.business_id, new.customer_id)
    on conflict (business_id, customer_id) do nothing;

    select * into v_bc from business_customers
      where business_id = new.business_id and customer_id = new.customer_id
      for update;

    v_new_count := v_bc.paid_transaction_count + 1;

    update business_customers
      set paid_transaction_count = v_new_count
      where id = v_bc.id;

    -- create the paid ticket tied to this transaction (customer still must click "submit")
    update tickets set transaction_id = new.id
      where id = new.ticket_id;

    -- loyalty: every Nth paid transaction => free ticket
    -- Read the interval from the business's own setting (owner-editable)
    select loyalty_interval into v_loyalty_interval from businesses where id = new.business_id;

    if v_new_count % v_loyalty_interval = 0 then
      insert into tickets (business_id, customer_id, status, is_free, amount)
      values (new.business_id, new.customer_id, 'pending', true, 0);

      update business_customers
        set free_tickets_earned = free_tickets_earned + 1
        where id = v_bc.id;
    end if;

  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_transaction_success
after update on transactions
for each row execute function handle_successful_transaction();

-- Also handle insert-as-success (e.g. webhook inserts directly with status success)
create trigger trg_transaction_insert_success
after insert on transactions
for each row when (new.status = 'success')
execute function handle_successful_transaction();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table profiles enable row level security;
alter table businesses enable row level security;
alter table business_customers enable row level security;
alter table tickets enable row level security;
alter table transactions enable row level security;
alter table expenses enable row level security;
alter table platform_settings enable row level security;

-- Helper: current user's role
create or replace function my_role() returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function my_business_id() returns uuid as $$
  select business_id from profiles where id = auth.uid();
$$ language sql stable security definer;

-- ---- PROFILES ----
create policy "super_admin full access profiles" on profiles
  for all using (my_role() = 'super_admin');

create policy "users view own profile" on profiles
  for select using (id = auth.uid());

create policy "owner views business staff/customers" on profiles
  for select using (
    my_role() in ('admin','barber','manager')
    and business_id = my_business_id()
  );

create policy "owner manages business staff" on profiles
  for insert with check (my_role() = 'admin');

create policy "owner updates own business profiles" on profiles
  for update using (my_role() = 'admin' and business_id = my_business_id());

create policy "users update own profile" on profiles
  for update using (id = auth.uid());

-- ---- BUSINESSES ----
create policy "super_admin full access businesses" on businesses
  for all using (my_role() = 'super_admin');

create policy "owner manages own business" on businesses
  for all using (owner_id = auth.uid());

create policy "staff/customers view their business" on businesses
  for select using (id = my_business_id());

-- ---- BUSINESS_CUSTOMERS ----
create policy "super_admin all business_customers" on business_customers
  for all using (my_role() = 'super_admin');

create policy "business staff view/manage own customers" on business_customers
  for all using (business_id = my_business_id() and my_role() in ('admin','barber','manager'));

create policy "customer views own loyalty record" on business_customers
  for select using (customer_id = auth.uid());

-- ---- TICKETS ----
create policy "super_admin all tickets" on tickets
  for all using (my_role() = 'super_admin');

create policy "business staff manage tickets" on tickets
  for all using (business_id = my_business_id() and my_role() in ('admin','barber','manager'));

create policy "customer view/create own tickets" on tickets
  for select using (customer_id = auth.uid());

create policy "customer submit own ticket" on tickets
  for update using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

-- ---- TRANSACTIONS ----
create policy "super_admin all transactions" on transactions
  for all using (my_role() = 'super_admin');

create policy "business views own transactions" on transactions
  for select using (business_id = my_business_id() and my_role() in ('admin','barber'));

create policy "customer views own transactions" on transactions
  for select using (customer_id = auth.uid());

-- inserts/updates to transactions happen via server-side (service role) from Paystack webhook only

-- ---- EXPENSES ----
create policy "super_admin all expenses" on expenses
  for all using (my_role() = 'super_admin');

create policy "business staff manage expenses" on expenses
  for all using (business_id = my_business_id() and my_role() in ('admin','barber','manager'));

-- ---- PLATFORM SETTINGS ----
create policy "super_admin manages settings" on platform_settings
  for all using (my_role() = 'super_admin');

create policy "everyone reads settings" on platform_settings
  for select using (true);
