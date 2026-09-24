import "server-only";

import { storageService } from "@/lib/azure/storage";
import { PAGE_SIZE } from "@/lib/config/media";
import {
  createClient,
  deleteMediaBlobs,
  isUuid,
  loadOwners,
  toOwner,
  type Client,
} from "@/lib/services/shared";
import type { MediaRow, MediaType } from "@/types/database";
import type { MediaItem, Page } from "@/types/media";

export function toMediaItem(row: MediaRow, owner: MediaItem["owner"] = null): MediaItem {
  return {
    id: row.id,
    ownerId: row.owner_id,
    albumId: row.album_id,
    type: row.type,
    title: row.title,
    description: row.description,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: Number(row.file_size),
    width: row.width,
    height: row.height,
    duration: row.duration == null ? null : Number(row.duration),
    status: row.status,
    viewCount: Number(row.view_count),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    url: row.status === "ready" ? storageService.getReadUrl(row.blob_key) : "",
    thumbnailUrl: row.thumbnail_blob_key ? storageService.getReadUrl(row.thumbnail_blob_key) : null,
    owner,
  };
}

async function withOwners(client: Client, rows: MediaRow[]): Promise<MediaItem[]> {
  const owners = await loadOwners(client, rows.map((r) => r.owner_id));
  return rows.map((r) => toMediaItem(r, toOwner(owners.get(r.owner_id))));
}

export const mediaService = {
  toMediaItem,

  /** Media detail honoring album visibility rules (SECURITY DEFINER RPC). */
  async getDetail(id: string): Promise<MediaItem | null> {
    if (!isUuid(id)) return null;
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_media_detail", { p_id: id });
    if (error) throw error;
    const row = (data as MediaRow[] | null)?.[0];
    if (!row) return null;
    const [item] = await withOwners(supabase, [row]);
    return item;
  },

  /** Items inside an album, honoring album access rules. Owners also see non-ready items. */
  async listByAlbum(albumId: string, opts: { offset?: number; limit?: number } = {}): Promise<Page<MediaItem>> {
    if (!isUuid(albumId)) return { items: [], nextOffset: null, total: 0 };
    const supabase = await createClient();
    const limit = opts.limit ?? PAGE_SIZE;
    const offset = opts.offset ?? 0;
    const [{ data, error }, countRes] = await Promise.all([
      supabase.rpc("get_album_media", { p_album_id: albumId, p_limit: limit, p_offset: offset }),
      supabase.rpc("count_album_media", { p_album_id: albumId }),
    ]);
    if (error) throw error;
    const rows = (data ?? []) as MediaRow[];
    const total = Number(countRes.data ?? rows.length);
    return {
      items: await withOwners(supabase, rows),
      nextOffset: offset + rows.length < total ? offset + limit : null,
      total,
    };
  },

  /** Owner's own media across all albums (RLS restricts to auth.uid()). */
  async listOwn(
    ownerId: string,
    opts: { offset?: number; limit?: number; type?: MediaType | null; albumId?: string | null } = {},
  ): Promise<Page<MediaItem>> {
    const supabase = await createClient();
    const limit = opts.limit ?? PAGE_SIZE;
    const offset = opts.offset ?? 0;
    let builder = supabase
      .from("media")
      .select("*", { count: "exact" })
      .eq("owner_id", ownerId)
      .neq("status", "pending")
      .order("created_at", { ascending: false });
    if (opts.type) builder = builder.eq("type", opts.type);
    if (opts.albumId) builder = builder.eq("album_id", opts.albumId);
    const { data, error, count } = await builder.range(offset, offset + limit - 1);
    if (error) throw error;
    const rows = (data ?? []) as MediaRow[];
    const total = count ?? rows.length;
    return {
      items: await withOwners(supabase, rows),
      nextOffset: offset + rows.length < total ? offset + limit : null,
      total,
    };
  },

  async getOwn(ownerId: string, id: string): Promise<MediaItem | null> {
    if (!isUuid(id)) return null;
    const supabase = await createClient();
    const { data } = await supabase.from("media").select("*").eq("id", id).eq("owner_id", ownerId).maybeSingle();
    if (!data) return null;
    const [item] = await withOwners(supabase, [data as MediaRow]);
    return item;
  },

  async update(ownerId: string, input: { id: string; title: string; description: string | null }) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("media")
      .update({ title: input.title, description: input.description })
      .eq("id", input.id)
      .eq("owner_id", ownerId)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    return data?.id ?? null;
  },

  /** Deletes metadata (RLS-guarded) then the Azure blobs. */
  async delete(ownerId: string, id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("media")
      .delete()
      .eq("id", id)
      .eq("owner_id", ownerId)
      .select("blob_key, thumbnail_blob_key")
      .maybeSingle();
    if (error) throw error;
    if (!data) return false;
    await deleteMediaBlobs([data]);
    return true;
  },

  async recordView(id: string, metadata?: Record<string, string | null>) {
    if (!isUuid(id)) return;
    const supabase = await createClient();
    await supabase.rpc("record_media_view", { p_media_id: id, p_metadata: metadata ?? null });
  },

  /** Time-limited download URL, only for media the caller can access. */
  async createDownloadUrl(id: string) {
    if (!isUuid(id)) return null;
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_media_detail", { p_id: id });
    const row = (data as MediaRow[] | null)?.[0];
    if (!row || row.status !== "ready") return null;
    return storageService.createDownloadUrl(row.blob_key, row.file_name);
  },
};
