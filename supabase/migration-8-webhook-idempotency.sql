-- Companion to the webhook fix for duplicate-delivery protection.
-- The trigger no longer needs to link tickets.transaction_id itself —
-- the webhook now does that explicitly and reliably, in whichever order
-- its two writes happen to occur (which now matters, since the webhook
-- claims the transaction via a conditional update *before* creating the
-- ticket, to safely reject duplicate/concurrent webhook deliveries).

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
