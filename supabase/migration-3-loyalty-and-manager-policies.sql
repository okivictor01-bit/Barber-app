-- Run this AFTER migration-2-add-manager-role.sql has been run and committed.

-- =========================================================
-- 1. Per-business loyalty setting (was a single global platform setting)
-- =========================================================
alter table businesses add column if not exists loyalty_interval int not null default 3;

-- =========================================================
-- 2. Update the free-ticket trigger to read the business's own setting
--    instead of the old global platform_settings value.
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

    select * into v_bc from business_customers
      where business_id = new.business_id and customer_id = new.customer_id
      for update;

    v_new_count := v_bc.paid_transaction_count + 1;

    update business_customers
      set paid_transaction_count = v_new_count
      where id = v_bc.id;

    update tickets set transaction_id = new.id
      where id = new.ticket_id;

    -- CHANGED: read the interval from the business itself, not a global setting
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

-- =========================================================
-- 3. Extend relevant RLS policies to include the new 'manager' role.
--    Managers can onboard/view customers, approve tickets, and submit
--    expenses (which still require owner approval).
-- =========================================================

drop policy if exists "owner views business staff/customers" on profiles;
create policy "owner views business staff/customers" on profiles
  for select using (
    my_role() in ('admin','barber','manager')
    and business_id = my_business_id()
  );

drop policy if exists "business staff manage tickets" on tickets;
create policy "business staff manage tickets" on tickets
  for all using (business_id = my_business_id() and my_role() in ('admin','barber','manager'));

drop policy if exists "business staff view/manage own customers" on business_customers;
create policy "business staff view/manage own customers" on business_customers
  for all using (business_id = my_business_id() and my_role() in ('admin','barber','manager'));

drop policy if exists "business staff manage expenses" on expenses;
create policy "business staff manage expenses" on expenses
  for all using (business_id = my_business_id() and my_role() in ('admin','barber','manager'));
