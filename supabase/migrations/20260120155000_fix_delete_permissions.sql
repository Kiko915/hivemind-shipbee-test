-- Fix Delete Permissions and Cascading

-- 1. Allow Admins to Delete Tickets (RLS)
-- Ensure RLS is enabled
alter table public.tickets enable row level security;

-- Drop existing policy if it exists to allow re-running
drop policy if exists "Admins can delete tickets" on public.tickets;

-- Create the delete policy
create policy "Admins can delete tickets"
on public.tickets
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- 2. Ensure Messages are deleted when a Ticket is deleted (Cascade)
-- We wrap this in a DO block to safely handle constraint modification
do $$
begin
  -- Check if the standard constraint name exists
  if exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'messages_ticket_id_fkey'
    and table_name = 'messages'
  ) then
    -- Drop the old constraint (likely RESTRICT)
    alter table public.messages drop constraint messages_ticket_id_fkey;
    
    -- Add the new constraint with CASCADE
    alter table public.messages
      add constraint messages_ticket_id_fkey
      foreign key (ticket_id)
      references public.tickets(id)
      on delete cascade;
  end if;
end $$;
