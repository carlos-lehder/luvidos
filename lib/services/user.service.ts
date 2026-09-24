import "server-only";

import { cache } from "react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import type { DashboardStats, ProfileRow } from "@/types/database";

export const userService = {
  /** Profile of the signed-in user, or null when signed out. */
  getCurrentProfile: cache(async (): Promise<ProfileRow | null> => {
    const user = await getCurrentUser();
    if (!user) return null;
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    return data ?? null;
  }),

  async getDashboardStats(): Promise<DashboardStats> {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_dashboard_stats");
    const stats = data as DashboardStats | null;
    return {
      total_albums: Number(stats?.total_albums ?? 0),
      total_media: Number(stats?.total_media ?? 0),
      total_images: Number(stats?.total_images ?? 0),
      total_videos: Number(stats?.total_videos ?? 0),
      total_views: Number(stats?.total_views ?? 0),
      storage_bytes: Number(stats?.storage_bytes ?? 0),
    };
  },

  async updateProfile(
    userId: string,
    input: { username: string; displayName: string | null; bio: string | null },
  ) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ username: input.username, display_name: input.displayName, bio: input.bio })
      .eq("id", userId);
    if (error) {
      if (error.code === "23505") return { ok: false as const, error: "That username is already taken." };
      return { ok: false as const, error: "Could not update your profile." };
    }
    return { ok: true as const };
  },

  async getRecentViews(userId: string, days = 30) {
    const supabase = await createClient();
    const since = new Date(Date.now() - days * 86400 * 1000).toISOString();
    const { data } = await supabase
      .from("media_views")
      .select("created_at, media_id, media!inner(owner_id)")
      .eq("media.owner_id", userId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);
    return (data ?? []).map((v) => ({ createdAt: v.created_at, mediaId: v.media_id }));
  },
};
