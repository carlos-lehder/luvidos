"use client";

import { FilmIcon, FolderOpenIcon, ImageIcon, UploadCloudIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { AlbumPicker, type AlbumOption } from "@/components/upload/album-picker";
import { UploadItemCard } from "@/components/upload/upload-item-card";
import { Button } from "@/components/ui/button";
import { ACCEPT_ATTRIBUTE, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE } from "@/lib/config/media";
import { probeFile, requestJson, uploadToAzure, type AuthorizeResponse } from "@/lib/upload/browser";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils/format";
import { validateFileDescriptor } from "@/lib/validation/media";
import type { MediaType } from "@/types/media";

export type UploadStatus =
  | "queued"
  | "preparing"
  | "uploading"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface UploadItem {
  id: string;
  file: File;
  type: MediaType;
  status: UploadStatus;
  progress: number;
  error?: string;
  previewUrl?: string;
  poster?: Blob;
  width?: number;
  height?: number;
  duration?: number;
  title: string;
  description: string;
  uploadSessionId?: string;
  mediaId?: string;
}

const CONCURRENCY = 2;

export function Uploader({ albums, initialAlbumId }: { albums: AlbumOption[]; initialAlbumId: string | null }) {
  const router = useRouter();
  const [albumId, setAlbumId] = useState<string | null>(initialAlbumId ?? albums[0]?.id ?? null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const controllers = useRef(new Map<string, AbortController>());
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const patch = useCallback((id: string, update: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...update } : it)));
  }, []);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const accepted: UploadItem[] = [];
      for (const file of Array.from(files)) {
        const result = validateFileDescriptor({ fileName: file.name, mimeType: file.type, fileSize: file.size });
        if (!result.ok) {
          toast.error(`${file.name}: ${result.error}`);
          continue;
        }
        accepted.push({
          id: crypto.randomUUID(),
          file,
          type: result.type,
          status: "queued",
          progress: 0,
          title: file.name.replace(/\.[^.]+$/, "").slice(0, 120),
          description: "",
        });
      }
      if (accepted.length === 0) return;
      setItems((prev) => [...prev, ...accepted]);
      for (const item of accepted) {
        probeFile(item.file, item.type).then((probe) => patch(item.id, probe));
      }
    },
    [patch],
  );

  async function runUpload(item: UploadItem, targetAlbumId: string) {
    const controller = new AbortController();
    controllers.current.set(item.id, controller);
    const { signal } = controller;
    const current = () => itemsRef.current.find((it) => it.id === item.id) ?? item;

    try {
      patch(item.id, { status: "preparing", progress: 0, error: undefined });
      const auth = await requestJson<AuthorizeResponse>(
        "/api/upload/authorize",
        {
          albumId: targetAlbumId,
          fileName: item.file.name,
          mimeType: item.file.type,
          fileSize: item.file.size,
          withThumbnail: item.type === "video" && !!current().poster,
        },
        signal,
      );
      patch(item.id, { uploadSessionId: auth.uploadSessionId, mediaId: auth.mediaId, status: "uploading" });

      await uploadToAzure(auth.uploadUrl, item.file, item.file.type, {
        signal,
        onProgress: (fraction) => patch(item.id, { progress: Math.round(fraction * 100) }),
      });

      let thumbnailUploaded = false;
      const poster = current().poster;
      if (auth.thumbnailUploadUrl && poster && poster.size <= auth.maxThumbnailSize) {
        try {
          await uploadToAzure(auth.thumbnailUploadUrl, poster, "image/jpeg", { signal });
          thumbnailUploaded = true;
        } catch {
          // Poster is optional; the media still completes.
        }
      }

      patch(item.id, { status: "processing", progress: 100 });
      const snapshot = current();
      await requestJson<{ mediaId: string }>(
        "/api/upload/complete",
        {
          uploadSessionId: auth.uploadSessionId,
          title: snapshot.title.trim() || item.file.name,
          description: snapshot.description,
          width: snapshot.width,
          height: snapshot.height,
          duration: snapshot.duration,
          thumbnailUploaded,
        },
        signal,
      );
      patch(item.id, { status: "completed" });
    } catch (error) {
      if (signal.aborted) {
        patch(item.id, { status: "cancelled", error: undefined });
      } else {
        const message = error instanceof Error ? error.message : "The file could not be uploaded.";
        patch(item.id, { status: "failed", error: message });
      }
    } finally {
      controllers.current.delete(item.id);
    }
  }

  async function startAll() {
    if (!albumId) {
      toast.error("Choose an album first.");
      return;
    }
    const queue = itemsRef.current.filter((it) => ["queued", "failed", "cancelled"].includes(it.status));
    if (queue.length === 0) return;
    const target = albumId;
    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (queue.length) {
        const next = queue.shift();
        if (next) await runUpload(next, target);
      }
    });
    await Promise.all(workers);
    const done = itemsRef.current.filter((it) => it.status === "completed").length;
    if (done) toast.success(`${done} file${done === 1 ? "" : "s"} uploaded`);
    router.refresh();
  }

  async function cancel(item: UploadItem) {
    controllers.current.get(item.id)?.abort();
    patch(item.id, { status: "cancelled" });
    if (item.uploadSessionId) {
      requestJson("/api/upload/cancel", { uploadSessionId: item.uploadSessionId }).catch(() => {});
    }
  }

  function remove(item: UploadItem) {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    setItems((prev) => prev.filter((it) => it.id !== item.id));
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files?.length) addFiles(event.dataTransfer.files);
  }

  const pendingCount = items.filter((it) => ["queued", "failed", "cancelled"].includes(it.status)).length;
  const activeCount = items.filter((it) => ["preparing", "uploading", "processing"].includes(it.status)).length;
  const currentAlbum = albums.find((a) => a.id === albumId);

  return (
    <div className="flex flex-col gap-6">
      <AlbumPicker albums={albums} value={albumId} onChange={setAlbumId} disabled={activeCount > 0} />

      <div
        role="button"
        tabIndex={0}
        aria-label="Drop files here or press Enter to browse"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          dragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
        )}
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UploadCloudIcon className="size-7" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-heading text-lg font-medium">Drag & drop files here</p>
          <p className="text-sm text-muted-foreground">
            or <span className="font-medium text-foreground underline underline-offset-4">browse</span> from your device
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ImageIcon className="size-3.5" aria-hidden="true" /> JPG, PNG, WEBP, GIF up to {formatBytes(MAX_IMAGE_SIZE, 0)}
          </span>
          <span className="inline-flex items-center gap-1">
            <FilmIcon className="size-3.5" aria-hidden="true" /> MP4, WEBM, MOV up to {formatBytes(MAX_VIDEO_SIZE, 0)}
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {items.length} file{items.length === 1 ? "" : "s"}
              {currentAlbum && ` → ${currentAlbum.title}`}
              {activeCount > 0 && ` · ${activeCount} in progress`}
            </p>
            <div className="flex items-center gap-2">
              {currentAlbum && items.some((it) => it.status === "completed") && (
                <Button variant="outline" render={<Link href={`/dashboard/albums/${currentAlbum.id}`} />}>
                  <FolderOpenIcon data-icon="inline-start" /> Open album
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => setItems((prev) => prev.filter((it) => it.status !== "completed"))}
                disabled={!items.some((it) => it.status === "completed")}
              >
                Clear completed
              </Button>
              <Button onClick={startAll} disabled={pendingCount === 0 || activeCount > 0 || !albumId}>
                <UploadCloudIcon data-icon="inline-start" />
                Upload {pendingCount > 0 ? `${pendingCount} file${pendingCount === 1 ? "" : "s"}` : ""}
              </Button>
            </div>
          </div>

          <ul className="flex flex-col gap-4">
            {items.map((item) => (
              <li key={item.id}>
                <UploadItemCard
                  item={item}
                  onChange={(update) => patch(item.id, update)}
                  onCancel={() => cancel(item)}
                  onRetry={() => albumId && runUpload(item, albumId)}
                  onRemove={() => remove(item)}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
