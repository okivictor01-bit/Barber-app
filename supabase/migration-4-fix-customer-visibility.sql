-- Fixes two related bugs: customers weren't showing up correctly on the
-- owner/barber/manager Customers page, and a linked customer's own
-- dashboard couldn't see their business's name/price.
--
-- Root cause: customers can belong to multiple businesses (tracked via
-- business_customers), so they don't have a single business_id on their
-- profile the way staff do. Two policies were checking that field anyway,
-- which silently blocked customer data from being read even when the
-- link was completely valid.

drop policy if exists "owner views business staff/customers" on profiles;
create policy "owner views business staff/customers" on profiles
  for select using (
    my_role() in ('admin','barber','manager')
    and (
      business_id = my_business_id()
      or exists (
        select 1 from business_customers bc
        where bc.customer_id = profiles.id and bc.business_id = my_business_id()
      )
    )
  );

drop policy if exists "staff/customers view their business" on businesses;
create policy "staff/customers view their business" on businesses
  for select using (
    id = my_business_id()
    or exists (
      select 1 from business_customers bc
      where bc.business_id = businesses.id and bc.customer_id = auth.uid()
    )
  );
