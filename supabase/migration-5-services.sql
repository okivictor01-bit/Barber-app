-- =========================================================
-- ADDITIONAL SERVICES (beard trimming, dyeing, dreadlock, etc.)
-- The standard haircut (businesses.default_price) remains the only
-- loyalty-eligible service — these extras never count toward the
-- free-haircut counter, per design.
-- =========================================================

create table services (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  price numeric(12,2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Track which service a payment/ticket was for, and whether it counted
-- toward loyalty. Nullable service_id + service_name = the standard
-- haircut (kept as the businesses.default_price flow, unchanged).
alter table transactions add column if not exists service_id uuid references services(id) on delete set null;
alter table transactions add column if not exists service_name text;
alter table transactions add column if not exists is_loyalty_eligible boolean not null default true;

alter table tickets add column if not exists service_id uuid references services(id) on delete set null;
alter table tickets add column if not exists service_name text;

-- =========================================================
-- Update the trigger: only count toward loyalty (and only ever
-- generate a free ticket) when the transaction was loyalty-eligible
-- (i.e. a standard haircut, not an add-on service).
-- =========================================================
create or replace function handle_successful_transaction() returns trigger as $$
declare
  v_loyalty_interval int;
  v_bc business_customers%rowtype;
  v_new_count int;
begin
  if new.status = 'success' and (old.status is distinct from 'success') then

    insert into business_customers (business_id, customer_id)
    values (new.business_id, new.customer_id)
    on conflict (business_id, customer_id) do nothing;

    update tickets set transaction_id = new.id
      where id = new.ticket_id;

    if new.is_loyalty_eligible then
      select * into v_bc from business_customers
        where business_id = new.business_id and customer_id = new.customer_id
        for update;

      v_new_count := v_bc.paid_transaction_count + 1;

      update business_customers
        set paid_transaction_count = v_new_count
        where id = v_bc.id;

      select loyalty_interval into v_loyalty_interval from businesses where id = new.business_id;

      if v_new_count % v_loyalty_interval = 0 then
        insert into tickets (business_id, customer_id, status, is_free, amount, service_name)
        values (new.business_id, new.customer_id, 'pending', true, 0, 'Haircut');

        update business_customers
          set free_tickets_earned = free_tickets_earned + 1
          where id = v_bc.id;
      end if;
    end if;

  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Make sure the trigger hooks actually exist (recreate defensively —
-- these were previously found to be silently missing on this project).
drop trigger if exists trg_transaction_success on transactions;
create trigger trg_transaction_success
after update on transactions
for each row execute function handle_successful_transaction();

drop trigger if exists trg_transaction_insert_success on transactions;
create trigger trg_transaction_insert_success
after insert on transactions
for each row when (new.status = 'success')
execute function handle_successful_transaction();

-- =========================================================
-- RLS for services
-- =========================================================
alter table services enable row level security;

create policy "owner manages own services" on services
  for all using (business_id = my_business_id() and my_role() = 'admin');

create policy "staff view own business services" on services
  for select using (business_id = my_business_id() and my_role() in ('admin','barber','manager'));

create policy "customer views linked business services" on services
  for select using (
    exists (
      select 1 from business_customers bc
      where bc.business_id = services.business_id and bc.customer_id = auth.uid()
    )
  );

create policy "super_admin full access services" on services
  for all using (my_role() = 'super_admin');
