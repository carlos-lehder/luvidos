"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { albumService } from "@/lib/services/album.service";
import { getCurrentUser } from "@/lib/supabase/server";
import { albumInputSchema, parseTagsInput, updateAlbumSchema } from "@/lib/validation/media";

export interface AlbumActionState {
  error?: string;
  success?: string;
  albumId?: string;
}

function revalidateAlbum(id?: string) {
  revalidatePath("/dashboard", "layout");
  if (id) revalidatePath(`/album/${id}`);
}

function parseAlbumForm(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    visibility: formData.get("visibility"),
    tags: parseTagsInput(String(formData.get("tags") ?? "")),
  };
}

export async function createAlbumAction(_prev: AlbumActionState, formData: FormData): Promise<AlbumActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const parsed = albumInputSchema.safeParse(parseAlbumForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  let albumId: string;
  try {
    albumId = await albumService.create(user.id, parsed.data);
  } catch (error) {
    console.error("[createAlbumAction]", error);
    return { error: "Could not create the album. Please try again." };
  }

  revalidateAlbum(albumId);
  if (formData.get("redirectTo") === "upload") redirect(`/dashboard/upload?album=${albumId}`);
  return { success: "Album created.", albumId };
}

export async function updateAlbumAction(_prev: AlbumActionState, formData: FormData): Promise<AlbumActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const parsed = updateAlbumSchema.safeParse({ id: formData.get("id"), ...parseAlbumForm(formData) });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  try {
    const updated = await albumService.update(user.id, parsed.data);
    if (!updated) return { error: "Album not found." };
  } catch (error) {
    console.error("[updateAlbumAction]", error);
    return { error: "Could not save your changes. Please try again." };
  }

  revalidateAlbum(parsed.data.id);
  return { success: "Changes saved.", albumId: parsed.data.id };
}

export async function deleteAlbumAction(id: string): Promise<AlbumActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  try {
    const deleted = await albumService.delete(user.id, id);
    if (!deleted) return { error: "Album not found." };
  } catch (error) {
    console.error("[deleteAlbumAction]", error);
    return { error: "Could not delete this album. Please try again." };
  }

  revalidateAlbum(id);
  return { success: "Album deleted." };
}

export async function setAlbumCoverAction(albumId: string, mediaId: string | null): Promise<AlbumActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  try {
    await albumService.setCover(user.id, albumId, mediaId);
  } catch (error) {
    console.error("[setAlbumCoverAction]", error);
    return { error: "Could not update the cover." };
  }

  revalidateAlbum(albumId);
  return { success: "Cover updated." };
}
