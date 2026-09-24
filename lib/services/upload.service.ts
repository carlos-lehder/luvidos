import "server-only";

import { blobKeys, storageService } from "@/lib/azure/storage";
import { MAX_THUMBNAIL_SIZE } from "@/lib/config/media";
import { processMedia } from "@/lib/processing/media-processor";
import { albumService } from "@/lib/services/album.service";
import { createClient } from "@/lib/supabase/server";
import { validateFileDescriptor } from "@/lib/validation/media";
import type { MediaRow } from "@/types/database";

export class UploadError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export const uploadService = {
  /**
   * Validates the file, creates a pending media row + upload session and
   * returns short-lived SAS URLs for a direct browser → Azure upload.
   */
  async authorize(
    userId: string,
    input: { albumId: string; fileName: string; mimeType: string; fileSize: number; withThumbnail: boolean },
  ) {
    const validation = validateFileDescriptor(input);
    if (!validation.ok) throw new UploadError(validation.error);
    if (!(await albumService.ownsAlbum(userId, input.albumId))) {
      throw new UploadError("Album not found.", 404);
    }

    const supabase = await createClient();
    const mediaId = crypto.randomUUID();
    const blobKey = blobKeys.original(userId, mediaId);

    const { data: media, error: mediaError } = await supabase
      .from("media")
      .insert({
        id: mediaId,
        owner_id: userId,
        album_id: input.albumId,
        type: validation.type,
        title: input.fileName.replace(/\.[^.]+$/, "").slice(0, 120) || "Untitled",
        file_name: input.fileName,
        mime_type: input.mimeType,
        file_size: input.fileSize,
        blob_key: blobKey,
        status: "pending",
      })
      .select("id")
      .single();
    if (mediaError || !media) throw new UploadError("Could not create media record.", 500);

    const { data: session, error: sessionError } = await supabase
      .from("upload_sessions")
      .insert({
        user_id: userId,
        media_id: mediaId,
        status: "uploading",
        file_name: input.fileName,
        mime_type: input.mimeType,
        file_size: input.fileSize,
      })
      .select("id")
      .single();
    if (sessionError || !session) {
      await supabase.from("media").delete().eq("id", mediaId);
      throw new UploadError("Could not create upload session.", 500);
    }

    const upload = storageService.createUploadUrl(blobKey, input.mimeType);
    const thumbnail =
      validation.type === "video" && input.withThumbnail
        ? storageService.createUploadUrl(blobKeys.thumbnail(userId, mediaId), "image/jpeg")
        : null;

    return {
      uploadSessionId: session.id,
      mediaId,
      type: validation.type,
      uploadUrl: upload.url,
      thumbnailUploadUrl: thumbnail?.url ?? null,
      maxThumbnailSize: MAX_THUMBNAIL_SIZE,
      expiresAt: upload.expiresOn.toISOString(),
    };
  },

  /**
   * Verifies the blob landed in Azure, persists metadata + tags, runs the
   * processing pipeline and marks the media ready.
   */
  async complete(
    userId: string,
    input: {
      uploadSessionId: string;
      title: string;
      description: string | null;
      width?: number;
      height?: number;
      duration?: number;
      thumbnailUploaded: boolean;
    },
  ) {
    const supabase = await createClient();

    const { data: session } = await supabase
      .from("upload_sessions")
      .select("*")
      .eq("id", input.uploadSessionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!session || !session.media_id) throw new UploadError("Upload session not found.", 404);
    if (session.status === "completed") throw new UploadError("Upload already completed.", 409);
    if (session.status === "cancelled") throw new UploadError("Upload was cancelled.", 409);

    const { data: media } = await supabase
      .from("media")
      .select("*")
      .eq("id", session.media_id)
      .eq("owner_id", userId)
      .maybeSingle();
    if (!media) throw new UploadError("Media record not found.", 404);

    const props = await storageService.getBlobProperties(media.blob_key);
    if (!props.exists || props.contentLength !== Number(media.file_size)) {
      await this.fail(session.id, media.id, "Uploaded file is missing or incomplete.");
      throw new UploadError("The uploaded file could not be verified. Please try again.", 422);
    }

    await supabase
      .from("upload_sessions")
      .update({ status: "processing" })
      .eq("id", session.id);
    await supabase
      .from("media")
      .update({
        status: "processing",
        title: input.title,
        description: input.description,
      })
      .eq("id", media.id);

    try {
      await storageService.setContentHeaders(media.blob_key, media.mime_type);
      const result = await processMedia(media as MediaRow, {
        width: input.width,
        height: input.height,
        duration: input.duration,
        thumbnailUploaded: input.thumbnailUploaded,
      });

      const { data: ready, error } = await supabase
        .from("media")
        .update({
          status: "ready",
          thumbnail_blob_key: result.thumbnailBlobKey,
          width: result.width,
          height: result.height,
          duration: result.duration,
        })
        .eq("id", media.id)
        .select("id")
        .single();
      if (error || !ready) throw error ?? new Error("Update failed");

      await supabase
        .from("upload_sessions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", session.id);

      // Album `updated_at` bumps so it sorts to the top of the owner's list.
      await supabase.from("albums").update({ updated_at: new Date().toISOString() }).eq("id", media.album_id);

      return { mediaId: media.id, albumId: media.album_id };
    } catch (error) {
      console.error("[upload.complete] processing failed", error);
      await this.fail(session.id, media.id, "Processing failed.");
      throw new UploadError("We couldn't process this file. Please try again.", 500);
    }
  },

  async cancel(userId: string, uploadSessionId: string) {
    const supabase = await createClient();
    const { data: session } = await supabase
      .from("upload_sessions")
      .select("id, media_id, status")
      .eq("id", uploadSessionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!session) return false;
    if (session.status === "completed") return false;

    await supabase
      .from("upload_sessions")
      .update({ status: "cancelled", completed_at: new Date().toISOString() })
      .eq("id", session.id);

    if (session.media_id) {
      const { data: media } = await supabase
        .from("media")
        .delete()
        .eq("id", session.media_id)
        .eq("owner_id", userId)
        .select("blob_key, thumbnail_blob_key")
        .maybeSingle();
      if (media) await storageService.deleteBlobs([media.blob_key, media.thumbnail_blob_key]);
    }
    return true;
  },

  async fail(sessionId: string, mediaId: string, reason: string) {
    const supabase = await createClient();
    await Promise.all([
      supabase
        .from("upload_sessions")
        .update({ status: "failed", error: reason, completed_at: new Date().toISOString() })
        .eq("id", sessionId),
      supabase.from("media").update({ status: "failed" }).eq("id", mediaId),
    ]);
  },
};
