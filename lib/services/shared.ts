import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { storageService } from "@/lib/azure/storage";
import { createClient } from "@/lib/supabase/server";
import type { Database, MediaRow } from "@/types/database";
import type { Owner, OwnerRow } from "@/types/media";

export type Client = SupabaseClient<Database>;

export function toOwner(row: OwnerRow | null | undefined): Owner | null {
  return row
    ? { id: row.id, username: row.username, displayName: row.display_name, avatarUrl: row.avatar_url }
    : null;
}

/** Loads owner profiles for a set of rows in a single query. */
export async function loadOwners(client: Client, ownerIds: string[]) {
  const ids = Array.from(new Set(ownerIds));
  if (ids.length === 0) return new Map<string, OwnerRow>();
  const { data } = await client
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", ids);
  return new Map((data ?? []).map((p) => [p.id, p]));
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** Replaces the tag set for an album. Caller must already be authorized (RLS enforces owner). */
export async function setAlbumTags(client: Client, albumId: string, tags: string[]) {
  const { error: delError } = await client.from("album_tags").delete().eq("album_id", albumId);
  if (delError) throw delError;
  if (tags.length === 0) return;

  const { error: upsertError } = await client
    .from("tags")
    .upsert(tags.map((name) => ({ name })), { onConflict: "name", ignoreDuplicates: true });
  if (upsertError) throw upsertError;

  const { data: tagRows, error: tagError } = await client.from("tags").select("id, name").in("name", tags);
  if (tagError) throw tagError;

  const { error: linkError } = await client
    .from("album_tags")
    .insert((tagRows ?? []).map((t) => ({ album_id: albumId, tag_id: t.id })));
  if (linkError) throw linkError;
}

export async function loadTagsForAlbums(client: Client, albumIds: string[]) {
  const map = new Map<string, string[]>();
  if (albumIds.length === 0) return map;
  const { data } = await client.from("album_tags").select("album_id, tags(name)").in("album_id", albumIds);
  for (const row of data ?? []) {
    const name = (row.tags as { name: string } | null)?.name;
    if (!name) continue;
    map.set(row.album_id, [...(map.get(row.album_id) ?? []), name]);
  }
  return map;
}

export async function deleteMediaBlobs(rows: Pick<MediaRow, "blob_key" | "thumbnail_blob_key">[]) {
  await storageService.deleteBlobs(rows.flatMap((r) => [r.blob_key, r.thumbnail_blob_key]));
}

export { createClient };
