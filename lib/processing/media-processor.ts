import "server-only";

import { readFile } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { blobKeys, storageService } from "@/lib/azure/storage";
import { SITE_NAME, THUMBNAIL_WIDTH } from "@/lib/config/media";
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

/** Creates an SVG watermark overlay sized for the given image dimensions. */
async function createWatermark(imgWidth: number, imgHeight: number): Promise<Buffer> {
  const scale = Math.max(imgWidth, imgHeight) / 1000;
  const logoSize = Math.round(80 * scale);
  const fontSize = Math.round(48 * scale);
  const gap = Math.round(12 * scale);

  // Load the SVG logo
  let logoSvg: string;
  try {
    logoSvg = await readFile(join(process.cwd(), "public/brand/logo.svg"), "utf8");
  } catch {
    logoSvg = "";
  }

  const logoDataUri = logoSvg
    ? `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}`
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${imgWidth}" height="${imgHeight}">
    <g transform="translate(${imgWidth / 2}, ${imgHeight / 2})" opacity="0.4" text-anchor="middle">
      ${logoDataUri ? `<image href="${logoDataUri}" width="${logoSize}" height="${logoSize}" x="${-logoSize / 2}" y="${-logoSize / 2 - fontSize / 2 - gap / 2}" />` : ""}
      <text x="0" y="${logoSvg ? logoSize / 2 + gap / 2 : 0}" dominant-baseline="central"
            font-family="system-ui, -apple-system, sans-serif" font-weight="800"
            font-size="${fontSize}" fill="white" letter-spacing="${scale * 2}"
            stroke="rgba(0,0,0,0.5)" stroke-width="${scale * 1.2}" paint-order="stroke">
        ${SITE_NAME}
      </text>
    </g>
  </svg>`;

  return Buffer.from(svg);
}

/** Downloads the original, derives dimensions and generates a JPEG thumbnail. */
const imageProcessor: MediaProcessor = {
  async process(media) {
    const buffer = await storageService.downloadToBuffer(media.blob_key);
    const image = sharp(buffer, { animated: false }).rotate();
    const meta = await image.metadata();
    const w = meta.width ?? 800;
    const h = meta.height ?? 600;

    // Apply watermark to the original and re-upload
    const watermark = await createWatermark(w, h);
    const watermarked = await sharp(buffer, { animated: false })
      .rotate()
      .composite([{ input: watermark, gravity: "southeast" }])
      .toBuffer();
    await storageService.uploadBuffer(media.blob_key, watermarked, media.mime_type);

    // Generate thumbnail from the watermarked image
    const thumbnail = await sharp(watermarked)
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
        // Watermark the video thumbnail
        try {
          const thumbBuffer = await storageService.downloadToBuffer(key);
          const thumbMeta = await sharp(thumbBuffer).metadata();
          const tw = thumbMeta.width ?? 640;
          const th = thumbMeta.height ?? 360;
          const watermark = await createWatermark(tw, th);
          const watermarked = await sharp(thumbBuffer)
            .composite([{ input: watermark, gravity: "southeast" }])
            .jpeg({ quality: 82, mozjpeg: true })
            .toBuffer();
          await storageService.uploadBuffer(key, watermarked, THUMBNAIL_MIME);
        } catch {
          // If watermarking fails, keep the original thumbnail
          await storageService.setContentHeaders(key, THUMBNAIL_MIME);
        }
        thumbnailBlobKey = key;
      }
    }
    // ponytail: no video file watermarking — add when ffmpeg is available on the server
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
