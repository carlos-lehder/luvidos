import type { MediaType } from "@/types/database";

export interface AuthorizeResponse {
  uploadSessionId: string;
  mediaId: string;
  type: MediaType;
  uploadUrl: string;
  thumbnailUploadUrl: string | null;
  maxThumbnailSize: number;
  expiresAt: string;
}

export interface ProbeResult {
  width?: number;
  height?: number;
  duration?: number;
  poster?: Blob;
  previewUrl: string;
}

const POSTER_WIDTH = 640;

/** Reads intrinsic dimensions (and for videos: duration + a poster frame) in the browser. */
export async function probeFile(file: File, type: MediaType): Promise<ProbeResult> {
  const previewUrl = URL.createObjectURL(file);
  try {
    if (type === "image") {
      const dims = await readImageSize(previewUrl);
      return { ...dims, previewUrl };
    }
    const video = await readVideo(previewUrl);
    return { ...video, previewUrl };
  } catch {
    return { previewUrl };
  }
}

function readImageSize(url: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = url;
  });
}

function readVideo(url: string) {
  return new Promise<{ width: number; height: number; duration: number; poster?: Blob }>(
    (resolve, reject) => {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.src = url;

      const timeout = setTimeout(() => reject(new Error("Timed out reading video")), 15000);
      const cleanup = () => {
        clearTimeout(timeout);
        video.removeAttribute("src");
        video.load();
      };

      video.onerror = () => {
        cleanup();
        reject(new Error("Could not decode video"));
      };

      video.onloadedmetadata = () => {
        const meta = {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: Number.isFinite(video.duration) ? video.duration : 0,
        };
        const seekTo = Math.min(1, meta.duration > 0 ? meta.duration * 0.1 : 0);
        video.onseeked = () => {
          try {
            const scale = Math.min(1, POSTER_WIDTH / (video.videoWidth || POSTER_WIDTH));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round((video.videoWidth || POSTER_WIDTH) * scale);
            canvas.height = Math.round((video.videoHeight || POSTER_WIDTH * 0.5625) * scale);
            canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
              (blob) => {
                cleanup();
                resolve({ ...meta, poster: blob ?? undefined });
              },
              "image/jpeg",
              0.82,
            );
          } catch {
            cleanup();
            resolve(meta);
          }
        };
        video.currentTime = seekTo;
      };
    },
  );
}

/** Direct browser → Azure upload with chunking, progress and cancellation. */
export async function uploadToAzure(
  sasUrl: string,
  data: Blob,
  contentType: string,
  options: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {},
) {
  const { BlockBlobClient } = await import("@azure/storage-blob");
  const client = new BlockBlobClient(sasUrl);
  await client.uploadData(data, {
    blobHTTPHeaders: { blobContentType: contentType },
    blockSize: 8 * 1024 * 1024,
    concurrency: 4,
    maxSingleShotSize: 32 * 1024 * 1024,
    abortSignal: options.signal,
    onProgress: ({ loadedBytes }) => {
      if (data.size > 0) options.onProgress?.(Math.min(1, loadedBytes / data.size));
    },
  });
}

export async function requestJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const json = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(json.error ?? "Request failed");
  return json;
}
