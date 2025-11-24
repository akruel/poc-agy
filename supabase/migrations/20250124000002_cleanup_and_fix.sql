-- 1. Re-create watched_episodes with correct column order and names
create table if not exists public.watched_episodes_new (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null default auth.uid(),
  tmdb_show_id integer not null,
  tmdb_episode_id integer not null,
  season_number integer not null,
  episode_number integer not null,
  watched_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, tmdb_episode_id)
);

-- 2. Enable RLS on new table
alter table public.watched_episodes_new enable row level security;

-- 3. Re-create policies
create policy "Users can view their own watched episodes" on public.watched_episodes_new for select using (auth.uid() = user_id);
create policy "Users can insert into their own watched episodes" on public.watched_episodes_new for insert with check (auth.uid() = user_id);
create policy "Users can delete from their own watched episodes" on public.watched_episodes_new for delete using (auth.uid() = user_id);

-- 4. Migrate data from user_interactions (Source of Truth)
insert into public.watched_episodes_new (user_id, tmdb_show_id, tmdb_episode_id, season_number, episode_number, watched_at)
select 
  user_id, 
  (metadata->>'show_id')::int, 
  content_id, -- This is the episode ID in user_interactions
  (metadata->>'season_number')::int, 
  (metadata->>'episode_number')::int, 
  created_at
from public.user_interactions
where interaction_type = 'watched' and content_type = 'episode'
and metadata->>'show_id' is not null
on conflict do nothing;

-- 5. Drop old tables
drop table if exists public.watched_episodes;
drop table if exists public.user_interactions;

-- 6. Rename new table to final name
alter table public.watched_episodes_new rename to watched_episodes;
