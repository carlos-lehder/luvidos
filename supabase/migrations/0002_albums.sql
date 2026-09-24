-- Luvidos: albums (folders) become the unit visitors browse.
-- Visibility and tags move to the album level; every media row belongs to one album.

-- ---------------------------------------------------------------------------
-- Albums
-- ---------------------------------------------------------------------------
create table public.albums (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  visibility public.media_visibility not null default 'private',
  cover_media_id uuid,
  view_count bigint not null default 0,
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint albums_title_length check (char_length(title) between 1 and 120),
  constraint albums_description_length check (description is null or char_length(description) <= 2000)
);

create index albums_owner_id_idx on public.albums (owner_id, created_at desc);
create index albums_public_latest_idx on public.albums (created_at desc) where visibility = 'public';
create index albums_public_popular_idx on public.albums (view_count desc, created_at desc) where visibility = 'public';
create index albums_search_idx on public.albums using gin (search_vector);

create trigger albums_set_updated_at before update on public.albums
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- media.album_id (backfill existing rows into a private "My uploads" album)
-- ---------------------------------------------------------------------------
alter table public.media add column album_id uuid references public.albums (id) on delete cascade;

with owners as (
  select distinct owner_id from public.media
), created as (
  insert into public.albums (owner_id, title, visibility)
  select owner_id, 'My uploads', 'private' from owners
  returning id, owner_id
)
update public.media m
set album_id = created.id
from created
where m.owner_id = created.owner_id;

alter table public.media alter column album_id set not null;
create index media_album_id_idx on public.media (album_id, created_at desc);
create index media_album_ready_idx on public.media (album_id, created_at desc) where status = 'ready';

alter table public.albums
  add constraint albums_cover_media_id_fkey
  foreign key (cover_media_id) references public.media (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Drop media-level visibility (album owns visibility now)
-- ---------------------------------------------------------------------------
drop policy if exists "media_select_public_or_own" on public.media;
drop index if exists public.media_public_latest_idx;
drop index if exists public.media_public_popular_idx;
drop index if exists public.media_visibility_idx;
alter table public.media drop column visibility;

-- ---------------------------------------------------------------------------
-- Tags move to albums
-- ---------------------------------------------------------------------------
drop table if exists public.media_tags;

create table public.album_tags (
  album_id uuid not null references public.albums (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (album_id, tag_id)
);
create index album_tags_tag_id_idx on public.album_tags (tag_id);

-- ---------------------------------------------------------------------------
-- Drop functions whose signatures/return types change
-- ---------------------------------------------------------------------------
drop function if exists public.get_media_detail(uuid);
drop function if exists public.get_media_tags(uuid);
drop function if exists public.record_media_view(uuid, jsonb);
drop function if exists public.search_media(text, public.media_type, int, int);
drop function if exists public.get_dashboard_stats();
drop function if exists public.get_profile_stats(uuid);

-- ---------------------------------------------------------------------------
-- View: album cards (counts + cover), RLS of underlying tables applies
-- ---------------------------------------------------------------------------
create view public.album_cards
with (security_invoker = true)
as
select
  a.id,
  a.owner_id,
  a.title,
  a.description,
  a.visibility,
  a.view_count,
  a.created_at,
  a.updated_at,
  coalesce(s.media_count, 0)::bigint as media_count,
  coalesce(s.image_count, 0)::bigint as image_count,
  coalesce(s.video_count, 0)::bigint as video_count,
  coalesce(s.total_size, 0)::bigint  as total_size,
  c.id                 as cover_media_id,
  c.type               as cover_type,
  c.blob_key           as cover_blob_key,
  c.thumbnail_blob_key as cover_thumbnail_blob_key
from public.albums a
left join lateral (
  select
    count(*) as media_count,
    count(*) filter (where m.type = 'image') as image_count,
    count(*) filter (where m.type = 'video') as video_count,
    sum(m.file_size) as total_size
  from public.media m
  where m.album_id = a.id and m.status = 'ready'
) s on true
left join lateral (
  select m.id, m.type, m.blob_key, m.thumbnail_blob_key
  from public.media m
  where m.album_id = a.id and m.status = 'ready'
  order by (m.id = a.cover_media_id) desc, m.created_at desc
  limit 1
) c on true;

grant select on public.album_cards to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.albums enable row level security;
alter table public.album_tags enable row level security;

create policy "albums_select_public_or_own" on public.albums
  for select using (visibility = 'public' or owner_id = auth.uid());
create policy "albums_insert_own" on public.albums
  for insert with check (owner_id = auth.uid());
create policy "albums_update_own" on public.albums
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "albums_delete_own" on public.albums
  for delete using (owner_id = auth.uid());

-- media: ready items in public albums are visible to all; owners see everything of theirs
create policy "media_select_public_album_or_own" on public.media
  for select using (
    owner_id = auth.uid()
    or (
      status = 'ready'
      and exists (
        select 1 from public.albums a
        where a.id = media.album_id and a.visibility = 'public'
      )
    )
  );

create policy "album_tags_select_visible" on public.album_tags
  for select using (exists (select 1 from public.albums a where a.id = album_id));
create policy "album_tags_insert_owner" on public.album_tags
  for insert with check (
    exists (select 1 from public.albums a where a.id = album_id and a.owner_id = auth.uid())
  );
create policy "album_tags_delete_owner" on public.album_tags
  for delete using (
    exists (select 1 from public.albums a where a.id = album_id and a.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Access helper: can the caller open this album (public/unlisted by link, private = owner)?
-- ---------------------------------------------------------------------------
create or replace function public.can_access_album(p_album_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.albums a
    where a.id = p_album_id
      and (a.visibility in ('public', 'unlisted') or a.owner_id = auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- RPC: album detail (unlisted reachable only by exact id)
-- ---------------------------------------------------------------------------
create or replace function public.get_album_detail(p_id uuid)
returns setof public.album_cards
language sql
security definer
set search_path = public
stable
as $$
  select * from public.album_cards
  where id = p_id and public.can_access_album(p_id);
$$;

create or replace function public.get_album_tags(p_album_id uuid)
returns setof text
language sql
security definer
set search_path = public
stable
as $$
  select t.name
  from public.album_tags at
  join public.tags t on t.id = at.tag_id
  where at.album_id = p_album_id and public.can_access_album(p_album_id)
  order by t.name;
$$;

-- Media inside an album (owners also see non-ready items)
create or replace function public.get_album_media(
  p_album_id uuid,
  p_limit int default 60,
  p_offset int default 0
)
returns setof public.media
language sql
security definer
set search_path = public
stable
as $$
  select m.*
  from public.media m
  join public.albums a on a.id = m.album_id
  where m.album_id = p_album_id
    and public.can_access_album(p_album_id)
    and (m.status = 'ready' or a.owner_id = auth.uid())
  order by m.created_at desc
  limit greatest(1, least(p_limit, 200))
  offset greatest(0, p_offset);
$$;

create or replace function public.count_album_media(p_album_id uuid)
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(*)
  from public.media m
  join public.albums a on a.id = m.album_id
  where m.album_id = p_album_id
    and public.can_access_album(p_album_id)
    and (m.status = 'ready' or a.owner_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- RPC: media detail via album access rules
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
  join public.albums a on a.id = m.album_id
  where m.id = p_id
    and (
      (m.status = 'ready' and a.visibility in ('public', 'unlisted'))
      or m.owner_id = auth.uid()
    );
$$;

-- ---------------------------------------------------------------------------
-- RPC: record a view (media + album counters)
-- ---------------------------------------------------------------------------
create or replace function public.record_media_view(p_media_id uuid, p_metadata jsonb default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_album_id uuid;
begin
  select m.album_id into v_album_id
  from public.media m
  join public.albums a on a.id = m.album_id
  where m.id = p_media_id
    and m.status = 'ready'
    and (a.visibility in ('public', 'unlisted') or m.owner_id = auth.uid());

  if v_album_id is null then
    return;
  end if;

  insert into public.media_views (media_id, viewer_id, metadata)
  values (p_media_id, auth.uid(), p_metadata);

  update public.media  set view_count = view_count + 1 where id = p_media_id;
  update public.albums set view_count = view_count + 1 where id = v_album_id;
end;
$$;

create or replace function public.record_album_view(p_album_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.albums
  set view_count = view_count + 1
  where id = p_album_id
    and (visibility in ('public', 'unlisted') or owner_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- RPC: public album search (title, description, tags, media titles)
-- ---------------------------------------------------------------------------
create or replace function public.search_albums(
  p_query text,
  p_type public.media_type default null,
  p_limit int default 24,
  p_offset int default 0
)
returns setof public.album_cards
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
  select ac.*
  from public.album_cards ac
  join public.albums a on a.id = ac.id, q
  where ac.visibility = 'public'
    and ac.media_count > 0
    and (
      p_type is null
      or (p_type = 'image' and ac.image_count > 0)
      or (p_type = 'video' and ac.video_count > 0)
    )
    and (
      q.raw is null
      or a.search_vector @@ q.tsq
      or a.title ilike '%' || q.raw || '%'
      or exists (
        select 1 from public.album_tags at
        join public.tags t on t.id = at.tag_id
        where at.album_id = a.id and t.name ilike '%' || lower(q.raw) || '%'
      )
      or exists (
        select 1 from public.media m
        where m.album_id = a.id and m.status = 'ready' and m.search_vector @@ q.tsq
      )
    )
  order by
    case when q.tsq is null then 0 else ts_rank(a.search_vector, q.tsq) end desc,
    ac.created_at desc
  limit greatest(1, least(p_limit, 60))
  offset greatest(0, p_offset);
$$;

-- ---------------------------------------------------------------------------
-- RPC: stats
-- ---------------------------------------------------------------------------
create or replace function public.get_dashboard_stats()
returns json
language sql
security invoker
stable
as $$
  select json_build_object(
    'total_albums', (select count(*) from public.albums where owner_id = auth.uid()),
    'total_media', count(*),
    'total_images', count(*) filter (where type = 'image'),
    'total_videos', count(*) filter (where type = 'video'),
    'total_views', coalesce(sum(view_count), 0),
    'storage_bytes', coalesce(sum(file_size), 0)
  )
  from public.media
  where owner_id = auth.uid();
$$;

create or replace function public.get_profile_stats(p_profile_id uuid)
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'total_albums', (
      select count(*) from public.albums
      where owner_id = p_profile_id and visibility = 'public'
    ),
    'total_uploads', count(m.*),
    'total_views', coalesce(sum(m.view_count), 0)
  )
  from public.media m
  join public.albums a on a.id = m.album_id
  where m.owner_id = p_profile_id
    and a.visibility = 'public'
    and m.status = 'ready';
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant execute on function public.can_access_album(uuid) to anon, authenticated;
grant execute on function public.get_album_detail(uuid) to anon, authenticated;
grant execute on function public.get_album_tags(uuid) to anon, authenticated;
grant execute on function public.get_album_media(uuid, int, int) to anon, authenticated;
grant execute on function public.count_album_media(uuid) to anon, authenticated;
grant execute on function public.get_media_detail(uuid) to anon, authenticated;
grant execute on function public.record_media_view(uuid, jsonb) to anon, authenticated;
grant execute on function public.record_album_view(uuid) to anon, authenticated;
grant execute on function public.search_albums(text, public.media_type, int, int) to anon, authenticated;
grant execute on function public.get_dashboard_stats() to authenticated;
grant execute on function public.get_profile_stats(uuid) to anon, authenticated;
