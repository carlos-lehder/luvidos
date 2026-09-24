import "server-only";

import sharp from "sharp";
import { blobKeys, storageService } from "@/lib/azure/storage";
import { THUMBNAIL_WIDTH } from "@/lib/config/media";
import type { MediaRow } from "@/types/database";

export interface ProcessingResult {
  thumbnailBlobKey: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
}

export interface ProcessingHints {
  width?: number;
  height?: number;
  duration?: number;
  /** Set when the browser already uploaded a client-generated thumbnail. */
  thumbnailUploaded?: boolean;
}

interface MediaProcessor {
  process(media: MediaRow, hints: ProcessingHints): Promise<ProcessingResult>;
}

const THUMBNAIL_MIME = "image/jpeg";

/** Downloads the original, derives dimensions and generates a JPEG thumbnail. */
const imageProcessor: MediaProcessor = {
  async process(media) {
    const buffer = await storageService.downloadToBuffer(media.blob_key);
    const image = sharp(buffer, { animated: false }).rotate();
    const meta = await image.metadata();

    const thumbnail = await image
      .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    const thumbnailBlobKey = blobKeys.thumbnail(media.owner_id, media.id);
    await storageService.uploadBuffer(thumbnailBlobKey, thumbnail, THUMBNAIL_MIME);

    return {
      thumbnailBlobKey,
      width: meta.width ?? null,
      height: meta.height ?? null,
      duration: null,
    };
  },
};

/**
 * Video processing runs no server-side transcoding yet. The browser generates a
 * poster frame at upload time; a background worker (ffmpeg / Azure Media) can be
 * plugged in here later without touching the upload flow.
 */
const videoProcessor: MediaProcessor = {
  async process(media, hints) {
    let thumbnailBlobKey: string | null = null;
    if (hints.thumbnailUploaded) {
      const key = blobKeys.thumbnail(media.owner_id, media.id);
      const props = await storageService.getBlobProperties(key);
      if (props.exists && props.contentLength > 0) {
        thumbnailBlobKey = key;
        await storageService.setContentHeaders(key, THUMBNAIL_MIME);
      }
    }
    return {
      thumbnailBlobKey,
      width: hints.width ?? null,
      height: hints.height ?? null,
      duration: hints.duration ?? null,
    };
  },
};

export function processMedia(media: MediaRow, hints: ProcessingHints = {}) {
  const processor = media.type === "image" ? imageProcessor : videoProcessor;
  return processor.process(media, hints);
}
