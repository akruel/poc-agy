-- Add member_name column to list_members table
alter table public.list_members
  add column if not exists member_name text;

-- Function to get list name (bypassing RLS for join page)
create or replace function public.get_list_name(list_id uuid)
returns text as $$
begin
  return (select name from public.lists where id = list_id);
end;
$$ language plpgsql security definer;
