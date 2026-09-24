-- Luvidos: link-only sharing.
-- Nothing is listable anonymously; albums/media are reachable only through their
-- share link (SECURITY DEFINER RPCs) or by their owner.

update public.albums set visibility = 'unlisted' where visibility = 'public';
alter table public.albums alter column visibility set default 'unlisted';

-- Owner-only table reads. Visitors always go through get_album_detail / get_album_media / get_media_detail.
drop policy if exists "albums_select_public_or_own" on public.albums;
create policy "albums_select_own" on public.albums
  for select using (owner_id = auth.uid());

drop policy if exists "media_select_public_album_or_own" on public.media;
create policy "media_select_own" on public.media
  for select using (owner_id = auth.uid());

drop policy if exists "album_tags_select_visible" on public.album_tags;
create policy "album_tags_select_own" on public.album_tags
  for select using (
    exists (select 1 from public.albums a where a.id = album_id and a.owner_id = auth.uid())
  );

-- No public discovery surface remains.
drop function if exists public.search_albums(text, public.media_type, int, int);
drop function if exists public.get_profile_stats(uuid);
drop index if exists public.albums_public_latest_idx;
drop index if exists public.albums_public_popular_idx;
