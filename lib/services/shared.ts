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

export async function deleteMediaBlobs(rows: Pick<MediaRow, "blob_key" | "thumbnail_blob_key">[]) {
  await storageService.deleteBlobs(rows.flatMap((r) => [r.blob_key, r.thumbnail_blob_key]));
}

export { createClient };
