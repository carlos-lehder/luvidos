import { z } from "zod";
import {
  ACCEPTED_MIME_TYPES,
  IMAGE_MIME_TYPES,
  MAX_DESCRIPTION_LENGTH,
  MAX_IMAGE_SIZE,
  MAX_TAG_LENGTH,
  MAX_TAGS_PER_MEDIA,
  MAX_THUMBNAIL_SIZE,
  MAX_TITLE_LENGTH,
  MAX_VIDEO_SIZE,
  VIDEO_MIME_TYPES,
} from "@/lib/config/media";
import type { MediaType } from "@/types/database";

export function getMediaTypeForMime(mimeType: string): MediaType | null {
  if (mimeType in IMAGE_MIME_TYPES) return "image";
  if (mimeType in VIDEO_MIME_TYPES) return "video";
  return null;
}

export function getExtension(fileName: string) {
  const idx = fileName.lastIndexOf(".");
  return idx === -1 ? "" : fileName.slice(idx + 1).toLowerCase();
}

export function getMaxSizeForType(type: MediaType) {
  return type === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
}

/** Validates a file client- or server-side without trusting the extension alone. */
export function validateFileDescriptor(input: {
  fileName: string;
  mimeType: string;
  fileSize: number;
}): { ok: true; type: MediaType } | { ok: false; error: string } {
  const type = getMediaTypeForMime(input.mimeType);
  if (!type) return { ok: false, error: "Unsupported file type." };

  const allowedExtensions = ACCEPTED_MIME_TYPES[input.mimeType];
  const ext = getExtension(input.fileName);
  if (!ext || !allowedExtensions.includes(ext)) {
    return { ok: false, error: "File extension does not match its content type." };
  }

  if (!Number.isFinite(input.fileSize) || input.fileSize <= 0) {
    return { ok: false, error: "The file is empty." };
  }
  if (input.fileSize > getMaxSizeForType(type)) {
    return {
      ok: false,
      error: type === "image" ? "Images must be 25 MB or smaller." : "Videos must be 2 GB or smaller.",
    };
  }
  if (input.fileName.length > 255 || /[\\/:*?"<>|\u0000-\u001f]/.test(input.fileName)) {
    return { ok: false, error: "Invalid file name." };
  }
  return { ok: true, type };
}

// Albums are link-only: reachable by anyone with the link, or private to the owner.
export const visibilitySchema = z.enum(["unlisted", "private"]);
export const mediaTypeSchema = z.enum(["image", "video"]);

export const tagSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Tags may only contain letters, numbers and dashes.")
  .max(MAX_TAG_LENGTH);

export const tagsSchema = z
  .array(tagSchema)
  .max(MAX_TAGS_PER_MEDIA)
  .transform((tags) => Array.from(new Set(tags)));

export const titleSchema = z.string().trim().min(1, "Title is required.").max(MAX_TITLE_LENGTH);
export const descriptionSchema = z
  .string()
  .trim()
  .max(MAX_DESCRIPTION_LENGTH)
  .transform((v) => (v.length ? v : null));

export const authorizeUploadSchema = z.object({
  albumId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  fileSize: z.number().int().positive(),
  withThumbnail: z.boolean().optional().default(false),
});

export const completeUploadSchema = z.object({
  uploadSessionId: z.string().uuid(),
  title: titleSchema,
  description: descriptionSchema.optional().default(""),
  width: z.number().int().positive().max(20000).optional(),
  height: z.number().int().positive().max(20000).optional(),
  duration: z.number().nonnegative().max(60 * 60 * 24).optional(),
  thumbnailUploaded: z.boolean().optional().default(false),
});

export const cancelUploadSchema = z.object({
  uploadSessionId: z.string().uuid(),
});

export const updateMediaSchema = z.object({
  id: z.string().uuid(),
  title: titleSchema,
  description: descriptionSchema,
});

export const albumInputSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  tags: tagsSchema,
  visibility: visibilitySchema,
});

export const updateAlbumSchema = albumInputSchema.extend({
  id: z.string().uuid(),
});

export const THUMBNAIL_MIME = "image/jpeg";
export { MAX_THUMBNAIL_SIZE };

export function parseTagsInput(raw: string) {
  return raw
    .split(/[,\n]/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}
