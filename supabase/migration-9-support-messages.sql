create table support_messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  message text not null,
  status text not null default 'new', -- new | read | resolved
  created_at timestamptz not null default now()
);

alter table support_messages enable row level security;

-- Anyone can submit (including logged-out visitors evaluating the platform)
create policy "anyone can submit a support message" on support_messages
  for insert with check (true);

-- Only the platform owner can read/manage submissions
create policy "super_admin manages support messages" on support_messages
  for all using (my_role() = 'super_admin');
