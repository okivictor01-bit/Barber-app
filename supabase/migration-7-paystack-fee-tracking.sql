-- Captures the real Paystack processing fee per transaction (from the
-- webhook payload) so business owners can see exactly what Paystack
-- charged them, not just our internal platform commission.

alter table transactions add column if not exists paystack_fee numeric(12,2);
alter table transactions add column if not exists used_subaccount boolean not null default false;
