-- Create user_profiles table
create table if not exists public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url text,
  is_anonymous boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_profiles enable row level security;

-- Policies
create policy "Users can view their own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, display_name, avatar_url, is_anonymous)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    (new.is_anonymous is true)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new users
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Function to migrate anonymous user data
create or replace function public.migrate_user_data(old_user_id uuid, new_user_id uuid)
returns void as $$
begin
  -- Verify that the executing user is the new_user_id (security check)
  if auth.uid() != new_user_id then
    raise exception 'Unauthorized migration attempt';
  end if;

  -- 1. Update lists ownership
  update public.lists
  set owner_id = new_user_id
  where owner_id = old_user_id;

  -- 2. Update list memberships
  -- Handle potential conflicts if user is already a member
  update public.list_members
  set user_id = new_user_id
  where user_id = old_user_id
  and not exists (
    select 1 from public.list_members existing
    where existing.list_id = public.list_members.list_id
    and existing.user_id = new_user_id
  );
  
  -- Delete any remaining old memberships (duplicates)
  delete from public.list_members where user_id = old_user_id;

  -- 3. Update list items added_by
  update public.list_items
  set added_by = new_user_id
  where added_by = old_user_id;

  -- 4. Update user interactions
  -- Handle conflicts for interactions
  update public.user_interactions
  set user_id = new_user_id
  where user_id = old_user_id
  and not exists (
    select 1 from public.user_interactions existing
    where existing.content_id = public.user_interactions.content_id
    and existing.content_type = public.user_interactions.content_type
    and existing.interaction_type = public.user_interactions.interaction_type
    and existing.user_id = new_user_id
  );

  -- Delete remaining old interactions (duplicates)
  delete from public.user_interactions where user_id = old_user_id;

  -- 5. Update user_profiles if needed (optional, usually new profile is better)
  -- But we might want to carry over some settings if we had them.
  
end;
$$ language plpgsql security definer;
