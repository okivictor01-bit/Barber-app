-- Adds columns to store each business's Paystack Subaccount settlement
-- details, so payments can auto-split directly to the owner's bank account.
-- (businesses.paystack_subaccount_code already existed in the base schema.)

alter table businesses add column if not exists settlement_bank_name text;
alter table businesses add column if not exists settlement_account_name text;
alter table businesses add column if not exists settlement_account_number text;
