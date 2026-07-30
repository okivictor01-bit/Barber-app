-- Run this file FIRST, on its own, then run migration-3 separately.
-- (Postgres requires a new enum value to be committed before it can be
-- referenced elsewhere, so these must be two separate SQL Editor runs.)

alter type user_role add value if not exists 'manager';
