-- Add tmdb_id column if it doesn't exist
alter table public.watched_episodes add column if not exists tmdb_id integer;

-- Re-migrate data for episodes to ensure tmdb_id is populated
-- First, clear existing data to avoid duplicates/conflicts during re-insertion
truncate table public.watched_episodes;

-- Insert again with tmdb_id
insert into public.watched_episodes (user_id, tmdb_id, tmdb_show_id, season_number, episode_number, watched_at)
select 
  user_id, 
  content_id, 
  (metadata->>'show_id')::int, 
  (metadata->>'season_number')::int, 
  (metadata->>'episode_number')::int, 
  created_at
from public.user_interactions
where interaction_type = 'watched' and content_type = 'episode'
and metadata->>'show_id' is not null
on conflict do nothing;

-- Add unique constraint on user_id and tmdb_id for faster lookups and integrity
alter table public.watched_episodes drop constraint if exists watched_episodes_user_id_tmdb_id_key;
alter table public.watched_episodes add constraint watched_episodes_user_id_tmdb_id_key unique (user_id, tmdb_id);
