"use server";

import { revalidatePath } from "next/cache";
import { mediaService } from "@/lib/services/media.service";
import { userService } from "@/lib/services/user.service";
import { getCurrentUser } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/validation/auth";
import { updateMediaSchema } from "@/lib/validation/media";

export interface ActionState {
  error?: string;
  success?: string;
}

function revalidateMedia(id: string, albumId?: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/media/${id}`);
  if (albumId) revalidatePath(`/album/${albumId}`);
}

export async function updateMediaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const parsed = updateMediaSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  try {
    const updated = await mediaService.update(user.id, parsed.data);
    if (!updated) return { error: "Media not found." };
  } catch (error) {
    console.error("[updateMediaAction]", error);
    return { error: "Could not save your changes. Please try again." };
  }

  revalidateMedia(parsed.data.id, String(formData.get("albumId") ?? "") || undefined);
  return { success: "Changes saved." };
}

export async function deleteMediaAction(id: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "Invalid media." };

  let albumId: string | undefined;
  try {
    albumId = (await mediaService.getOwn(user.id, id))?.albumId;
    const deleted = await mediaService.delete(user.id, id);
    if (!deleted) return { error: "Media not found." };
  } catch (error) {
    console.error("[deleteMediaAction]", error);
    return { error: "Could not delete this media. Please try again." };
  }

  revalidateMedia(id, albumId);
  return { success: "Media deleted." };
}

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const parsed = profileUpdateSchema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName") ?? "",
    bio: formData.get("bio") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const result = await userService.updateProfile(user.id, parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath("/", "layout");
  return { success: "Profile updated." };
}
