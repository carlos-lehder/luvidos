-- Luvidos initial schema
-- Supabase stores application data & media metadata. Binary media lives in Azure Blob Storage.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.media_type as enum ('image', 'video');
create type public.media_visibility as enum ('public', 'unlisted', 'private');
create type public.media_status as enum ('pending', 'processing', 'ready', 'failed');
create type public.upload_status as enum ('pending', 'uploading', 'processing', 'completed', 'failed', 'cancelled');

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,30}$'),
  constraint profiles_display_name_length check (display_name is null or char_length(display_name) <= 60),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 300)
);

create index profiles_username_idx on public.profiles (username);

-- ---------------------------------------------------------------------------
-- Media metadata (binary lives in Azure at blob_key / thumbnail_blob_key)
-- ---------------------------------------------------------------------------
create table public.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  type public.media_type not null,
  title text not null,
  description text,
  file_name text not null,
  mime_type text not null,
  file_size bigint not null check (file_size > 0),
  blob_key text not null unique,
  thumbnail_blob_key text,
  width integer,
  height integer,
  duration numeric(10, 3),
  visibility public.media_visibility not null default 'private',
  status public.media_status not null default 'pending',
  view_count bigint not null default 0,
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(file_name, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_title_length check (char_length(title) between 1 and 120),
  constraint media_description_length check (description is null or char_length(description) <= 2000)
);

create index media_owner_id_idx on public.media (owner_id, created_at desc);
create index media_public_latest_idx on public.media (created_at desc) where visibility = 'public' and status = 'ready';
create index media_public_popular_idx on public.media (view_count desc, created_at desc) where visibility = 'public' and status = 'ready';
create index media_type_idx on public.media (type);
create index media_visibility_idx on public.media (visibility);
create index media_mime_type_idx on public.media (mime_type);
create index media_search_idx on public.media using gin (search_vector);
create index media_title_trgm_idx on public.media (lower(title));

-- ---------------------------------------------------------------------------
-- Tags
-- ---------------------------------------------------------------------------
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  constraint tags_name_format check (name ~ '^[a-z0-9][a-z0-9\-]{0,31}$')
);

create table public.media_tags (
  media_id uuid not null references public.media (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (media_id, tag_id)
);

create index media_tags_tag_id_idx on public.media_tags (tag_id);

-- ---------------------------------------------------------------------------
-- Views (analytics)
-- ---------------------------------------------------------------------------
create table public.media_views (
  id bigint generated always as identity primary key,
  media_id uuid not null references public.media (id) on delete cascade,
  viewer_id uuid references public.profiles (id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index media_views_media_id_idx on public.media_views (media_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Upload sessions
-- ---------------------------------------------------------------------------
create table public.upload_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  media_id uuid references public.media (id) on delete set null,
  status public.upload_status not null default 'pending',
  file_name text not null,
  mime_type text not null,
  file_size bigint not null,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index upload_sessions_user_id_idx on public.upload_sessions (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger media_set_updated_at before update on public.media
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile when a user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate text;
  attempt int := 0;
begin
  base_username := lower(coalesce(
    new.raw_user_meta_data ->> 'username',
    split_part(new.email, '@', 1)
  ));
  base_username := regexp_replace(base_username, '[^a-z0-9_]', '_', 'g');
  base_username := left(base_username, 24);
  if char_length(base_username) < 3 then
    base_username := 'user_' || left(replace(new.id::text, '-', ''), 8);
  end if;

  candidate := base_username;
  while exists (select 1 from public.profiles where username = candidate) loop
    attempt := attempt + 1;
    candidate := left(base_username, 24) || '_' || attempt;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    candidate,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RPC: media detail (public/unlisted for anyone, private for owner only)
-- Unlisted rows are intentionally NOT readable via table policies so they
-- never leak through list queries; they are only reachable by exact id here.
-- ---------------------------------------------------------------------------
create or replace function public.get_media_detail(p_id uuid)
returns setof public.media
language sql
security definer
set search_path = public
stable
as $$
  select m.*
  from public.media m
  where m.id = p_id
    and (
      (m.status = 'ready' and m.visibility in ('public', 'unlisted'))
      or m.owner_id = auth.uid()
    );
$$;

-- Tags for a single media item, with the same access rules as get_media_detail.
create or replace function public.get_media_tags(p_media_id uuid)
returns setof text
language sql
security definer
set search_path = public
stable
as $$
  select t.name
  from public.media m
  join public.media_tags mt on mt.media_id = m.id
  join public.tags t on t.id = mt.tag_id
  where m.id = p_media_id
    and (
      (m.status = 'ready' and m.visibility in ('public', 'unlisted'))
      or m.owner_id = auth.uid()
    )
  order by t.name;
$$;

-- ---------------------------------------------------------------------------
-- RPC: record a view (anyone, but only for accessible media)
-- ---------------------------------------------------------------------------
create or replace function public.record_media_view(p_media_id uuid, p_metadata jsonb default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.media
    where id = p_media_id
      and status = 'ready'
      and (visibility in ('public', 'unlisted') or owner_id = auth.uid())
  ) then
    return;
  end if;

  insert into public.media_views (media_id, viewer_id, metadata)
  values (p_media_id, auth.uid(), p_metadata);

  update public.media set view_count = view_count + 1 where id = p_media_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: public search (title, description, file name, tags)
-- ---------------------------------------------------------------------------
create or replace function public.search_media(
  p_query text,
  p_type public.media_type default null,
  p_limit int default 24,
  p_offset int default 0
)
returns setof public.media
language sql
security invoker
stable
as $$
  with q as (
    select
      nullif(trim(coalesce(p_query, '')), '') as raw,
      case when nullif(trim(coalesce(p_query, '')), '') is null
        then null
        else websearch_to_tsquery('simple', trim(p_query))
      end as tsq
  )
  select m.*
  from public.media m, q
  where m.visibility = 'public'
    and m.status = 'ready'
    and (p_type is null or m.type = p_type)
    and (
      q.raw is null
      or m.search_vector @@ q.tsq
      or m.title ilike '%' || q.raw || '%'
      or exists (
        select 1
        from public.media_tags mt
        join public.tags t on t.id = mt.tag_id
        where mt.media_id = m.id and t.name ilike '%' || lower(q.raw) || '%'
      )
    )
  order by
    case when q.tsq is null then 0 else ts_rank(m.search_vector, q.tsq) end desc,
    m.created_at desc
  limit greatest(1, least(p_limit, 60))
  offset greatest(0, p_offset);
$$;

-- ---------------------------------------------------------------------------
-- RPC: dashboard statistics for the current user
-- ---------------------------------------------------------------------------
create or replace function public.get_dashboard_stats()
returns json
language sql
security invoker
stable
as $$
  select json_build_object(
    'total_media', count(*),
    'total_images', count(*) filter (where type = 'image'),
    'total_videos', count(*) filter (where type = 'video'),
    'total_views', coalesce(sum(view_count), 0),
    'storage_bytes', coalesce(sum(file_size), 0)
  )
  from public.media
  where owner_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- RPC: public profile statistics
-- ---------------------------------------------------------------------------
create or replace function public.get_profile_stats(p_profile_id uuid)
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'total_uploads', count(*),
    'total_views', coalesce(sum(view_count), 0)
  )
  from public.media
  where owner_id = p_profile_id
    and visibility = 'public'
    and status = 'ready';
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.media enable row level security;
alter table public.tags enable row level security;
alter table public.media_tags enable row level security;
alter table public.media_views enable row level security;
alter table public.upload_sessions enable row level security;

-- profiles: readable by everyone, editable by owner
create policy "profiles_select_all" on public.profiles
  for select using (true);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- media: public+ready readable by all; owners see all of their own
create policy "media_select_public_or_own" on public.media
  for select using (
    (visibility = 'public' and status = 'ready')
    or owner_id = auth.uid()
  );
create policy "media_insert_own" on public.media
  for insert with check (owner_id = auth.uid());
create policy "media_update_own" on public.media
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "media_delete_own" on public.media
  for delete using (owner_id = auth.uid());

-- tags: readable by all, creatable by authenticated users
create policy "tags_select_all" on public.tags
  for select using (true);
create policy "tags_insert_authenticated" on public.tags
  for insert with check (auth.role() = 'authenticated');

-- media_tags: visible when the media is visible; managed by media owner
create policy "media_tags_select_visible" on public.media_tags
  for select using (
    exists (select 1 from public.media m where m.id = media_id)
  );
create policy "media_tags_insert_owner" on public.media_tags
  for insert with check (
    exists (select 1 from public.media m where m.id = media_id and m.owner_id = auth.uid())
  );
create policy "media_tags_delete_owner" on public.media_tags
  for delete using (
    exists (select 1 from public.media m where m.id = media_id and m.owner_id = auth.uid())
  );

-- media_views: owners can read analytics for their media; writes go through record_media_view()
create policy "media_views_select_owner" on public.media_views
  for select using (
    exists (select 1 from public.media m where m.id = media_id and m.owner_id = auth.uid())
  );

-- upload_sessions: owner only
create policy "upload_sessions_all_own" on public.upload_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Grants for RPCs
-- ---------------------------------------------------------------------------
grant execute on function public.get_media_detail(uuid) to anon, authenticated;
grant execute on function public.get_media_tags(uuid) to anon, authenticated;
grant execute on function public.record_media_view(uuid, jsonb) to anon, authenticated;
grant execute on function public.search_media(text, public.media_type, int, int) to anon, authenticated;
grant execute on function public.get_dashboard_stats() to authenticated;
grant execute on function public.get_profile_stats(uuid) to anon, authenticated;
