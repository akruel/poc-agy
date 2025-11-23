-- Drop the trigger first
drop trigger if exists on_auth_user_created on auth.users;

-- Drop the function used by the trigger
drop function if exists public.handle_new_user();

-- Drop the table
drop table if exists public.user_profiles;
