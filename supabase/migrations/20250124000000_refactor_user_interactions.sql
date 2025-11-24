-- Create watchlists table
create table if not exists public.watchlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null default auth.uid(),
  tmdb_id integer not null,
  media_type text check (media_type in ('movie', 'tv')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, tmdb_id, media_type)
);

-- Create watched_movies table
create table if not exists public.watched_movies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null default auth.uid(),
  tmdb_id integer not null,
  watched_at timestamp with time zone default timezone('utc'::text, now()) not null,
  rating integer check (rating >= 0 and rating <= 10),
  unique(user_id, tmdb_id)
);

-- Create watched_episodes table
create table if not exists public.watched_episodes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null default auth.uid(),
  tmdb_id integer not null, -- Episode ID
  tmdb_show_id integer not null,
  season_number integer not null,
  episode_number integer not null,
  watched_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, tmdb_id)
);

-- Create series_cache table
create table if not exists public.series_cache (
  tmdb_id integer primary key,
  total_episodes integer not null,
  number_of_seasons integer not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.watchlists enable row level security;
alter table public.watched_movies enable row level security;
alter table public.watched_episodes enable row level security;
alter table public.series_cache enable row level security;

-- Policies for watchlists
drop policy if exists "Users can view their own watchlist" on public.watchlists;
create policy "Users can view their own watchlist" on public.watchlists for select using (auth.uid() = user_id);

drop policy if exists "Users can insert into their own watchlist" on public.watchlists;
create policy "Users can insert into their own watchlist" on public.watchlists for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete from their own watchlist" on public.watchlists;
create policy "Users can delete from their own watchlist" on public.watchlists for delete using (auth.uid() = user_id);

-- Policies for watched_movies
drop policy if exists "Users can view their own watched movies" on public.watched_movies;
create policy "Users can view their own watched movies" on public.watched_movies for select using (auth.uid() = user_id);

drop policy if exists "Users can insert into their own watched movies" on public.watched_movies;
create policy "Users can insert into their own watched movies" on public.watched_movies for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete from their own watched movies" on public.watched_movies;
create policy "Users can delete from their own watched movies" on public.watched_movies for delete using (auth.uid() = user_id);

-- Policies for watched_episodes
drop policy if exists "Users can view their own watched episodes" on public.watched_episodes;
create policy "Users can view their own watched episodes" on public.watched_episodes for select using (auth.uid() = user_id);

drop policy if exists "Users can insert into their own watched episodes" on public.watched_episodes;
create policy "Users can insert into their own watched episodes" on public.watched_episodes for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete from their own watched episodes" on public.watched_episodes;
create policy "Users can delete from their own watched episodes" on public.watched_episodes for delete using (auth.uid() = user_id);

-- Policies for series_cache
drop policy if exists "Anyone can read series cache" on public.series_cache;
create policy "Anyone can read series cache" on public.series_cache for select using (true);

drop policy if exists "Authenticated users can update series cache" on public.series_cache;
create policy "Authenticated users can update series cache" on public.series_cache for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update series cache update" on public.series_cache;
create policy "Authenticated users can update series cache update" on public.series_cache for update using (auth.role() = 'authenticated');


-- DATA MIGRATION
do $$
begin
  -- Migrate Watchlist
  insert into public.watchlists (user_id, tmdb_id, media_type, created_at)
  select user_id, content_id, content_type, created_at
  from public.user_interactions
  where interaction_type = 'watchlist' and content_type in ('movie', 'tv')
  on conflict do nothing;

  -- Migrate Watched Movies
  insert into public.watched_movies (user_id, tmdb_id, watched_at)
  select user_id, content_id, created_at
  from public.user_interactions
  where interaction_type = 'watched' and content_type = 'movie'
  on conflict do nothing;

  -- Migrate Watched Episodes
  insert into public.watched_episodes (user_id, tmdb_id, tmdb_show_id, season_number, episode_number, watched_at)
  select 
    user_id, 
    content_id, -- This is the episode ID
    (metadata->>'show_id')::int, 
    (metadata->>'season_number')::int, 
    (metadata->>'episode_number')::int, 
    created_at
  from public.user_interactions
  where interaction_type = 'watched' and content_type = 'episode'
  and metadata->>'show_id' is not null
  on conflict do nothing;

  -- Migrate Series Cache
  insert into public.series_cache (tmdb_id, total_episodes, number_of_seasons, updated_at)
  select 
    content_id, 
    (metadata->>'total_episodes')::int, 
    (metadata->>'number_of_seasons')::int, 
    created_at
  from public.user_interactions
  where content_type = 'series_metadata'
  on conflict (tmdb_id) do update 
  set total_episodes = excluded.total_episodes, 
      number_of_seasons = excluded.number_of_seasons,
      updated_at = excluded.updated_at;

end $$;
