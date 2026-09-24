import "server-only";

import { storageService } from "@/lib/azure/storage";
import { PAGE_SIZE } from "@/lib/config/media";
import {
  createClient,
  deleteMediaBlobs,
  isUuid,
  loadOwners,
  loadTagsForAlbums,
  setAlbumTags,
  toOwner,
  type Client,
} from "@/lib/services/shared";
import type { AlbumCardRow, MediaVisibility } from "@/types/database";
import type { AlbumItem, Page } from "@/types/media";

export function toAlbumItem(row: AlbumCardRow, owner: AlbumItem["owner"] = null, tags: string[] = []): AlbumItem {
  const coverKey = row.cover_thumbnail_blob_key ?? (row.cover_type === "image" ? row.cover_blob_key : null);
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    visibility: row.visibility,
    viewCount: Number(row.view_count),
    mediaCount: Number(row.media_count),
    imageCount: Number(row.image_count),
    videoCount: Number(row.video_count),
    totalSize: Number(row.total_size),
    coverMediaId: row.cover_media_id,
    coverUrl: coverKey ? storageService.getReadUrl(coverKey) : null,
    coverType: row.cover_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags,
    owner,
  };
}

async function hydrate(client: Client, rows: AlbumCardRow[], withTags = false): Promise<AlbumItem[]> {
  const [owners, tags] = await Promise.all([
    loadOwners(client, rows.map((r) => r.owner_id)),
    withTags ? loadTagsForAlbums(client, rows.map((r) => r.id)) : Promise.resolve(new Map<string, string[]>()),
  ]);
  return rows.map((r) => toAlbumItem(r, toOwner(owners.get(r.owner_id)), tags.get(r.id) ?? []));
}

export const albumService = {
  toAlbumItem,

  /** Album detail honoring unlisted/private rules (SECURITY DEFINER RPC). */
  async getDetail(id: string): Promise<AlbumItem | null> {
    if (!isUuid(id)) return null;
    const supabase = await createClient();
    const [{ data, error }, tagsRes] = await Promise.all([
      supabase.rpc("get_album_detail", { p_id: id }),
      supabase.rpc("get_album_tags", { p_album_id: id }),
    ]);
    if (error) throw error;
    const row = (data as AlbumCardRow[] | null)?.[0];
    if (!row) return null;
    const owners = await loadOwners(supabase, [row.owner_id]);
    return toAlbumItem(row, toOwner(owners.get(row.owner_id)), (tagsRes.data as string[] | null) ?? []);
  },

  /** All albums of the signed-in owner (RLS restricts to auth.uid()). */
  async listOwn(ownerId: string, opts: { offset?: number; limit?: number } = {}): Promise<Page<AlbumItem>> {
    const supabase = await createClient();
    const limit = opts.limit ?? PAGE_SIZE;
    const offset = opts.offset ?? 0;
    const { data, error, count } = await supabase
      .from("album_cards")
      .select("*", { count: "exact" })
      .eq("owner_id", ownerId)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    const rows = (data ?? []) as AlbumCardRow[];
    const total = count ?? rows.length;
    return {
      items: await hydrate(supabase, rows, true),
      nextOffset: offset + rows.length < total ? offset + limit : null,
      total,
    };
  },

  /** Lightweight list for pickers (upload page). */
  async listOwnOptions(ownerId: string) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("albums")
      .select("id, title, visibility")
      .eq("owner_id", ownerId)
      .order("updated_at", { ascending: false })
      .limit(200);
    return (data ?? []) as { id: string; title: string; visibility: MediaVisibility }[];
  },

  async getOwn(ownerId: string, id: string): Promise<AlbumItem | null> {
    if (!isUuid(id)) return null;
    const supabase = await createClient();
    const { data } = await supabase.from("album_cards").select("*").eq("id", id).eq("owner_id", ownerId).maybeSingle();
    if (!data) return null;
    const [item] = await hydrate(supabase, [data as AlbumCardRow], true);
    return item;
  },

  async ownsAlbum(ownerId: string, id: string) {
    if (!isUuid(id)) return false;
    const supabase = await createClient();
    const { data } = await supabase.from("albums").select("id").eq("id", id).eq("owner_id", ownerId).maybeSingle();
    return !!data;
  },

  async create(
    ownerId: string,
    input: { title: string; description: string | null; visibility: MediaVisibility; tags: string[] },
  ) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("albums")
      .insert({ owner_id: ownerId, title: input.title, description: input.description, visibility: input.visibility })
      .select("id")
      .single();
    if (error || !data) throw error ?? new Error("Insert failed");
    await setAlbumTags(supabase, data.id, input.tags);
    return data.id;
  },

  async update(
    ownerId: string,
    input: {
      id: string;
      title: string;
      description: string | null;
      visibility: MediaVisibility;
      tags: string[];
      coverMediaId?: string | null;
    },
  ) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("albums")
      .update({
        title: input.title,
        description: input.description,
        visibility: input.visibility,
        ...(input.coverMediaId !== undefined ? { cover_media_id: input.coverMediaId } : {}),
      })
      .eq("id", input.id)
      .eq("owner_id", ownerId)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    await setAlbumTags(supabase, input.id, input.tags);
    return data.id;
  },

  async setCover(ownerId: string, albumId: string, mediaId: string | null) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("albums")
      .update({ cover_media_id: mediaId })
      .eq("id", albumId)
      .eq("owner_id", ownerId);
    if (error) throw error;
  },

  /** Deletes the album, its media rows (cascade) and all blobs. */
  async delete(ownerId: string, id: string) {
    const supabase = await createClient();
    const { data: media } = await supabase
      .from("media")
      .select("blob_key, thumbnail_blob_key")
      .eq("album_id", id)
      .eq("owner_id", ownerId);
    const { data, error } = await supabase
      .from("albums")
      .delete()
      .eq("id", id)
      .eq("owner_id", ownerId)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return false;
    await deleteMediaBlobs(media ?? []);
    return true;
  },

  async recordView(id: string) {
    if (!isUuid(id)) return;
    const supabase = await createClient();
    await supabase.rpc("record_album_view", { p_album_id: id });
  },
};
