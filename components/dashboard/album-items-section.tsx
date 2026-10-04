"use client";

import { UploadCloudIcon, UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { MediaGrid } from "@/components/dashboard/media-grid";
import { EmptyState } from "@/components/media/empty-state";
import { UploadItemCard } from "@/components/upload/upload-item-card";
import type { UploadItem } from "@/components/upload/uploader";
import { Button } from "@/components/ui/button";
import { ACCEPT_ATTRIBUTE } from "@/lib/config/media";
import { probeFile, requestJson, uploadToAzure, type AuthorizeResponse } from "@/lib/upload/browser";
import { cn } from "@/lib/utils";
import { validateFileDescriptor } from "@/lib/validation/media";
import type { MediaItem } from "@/types/media";

const CONCURRENCY = 2;

export function AlbumItemsSection({
  albumId,
  items: mediaItems,
  siteUrl,
  coverMediaId,
}: {
  albumId: string;
  items: MediaItem[];
  siteUrl: string;
  coverMediaId: string | null;
}) {
  const router = useRouter();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const controllers = useRef(new Map<string, AbortController>());
  const uploadsRef = useRef(uploads);
  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);

  const patch = useCallback((id: string, update: Partial<UploadItem>) => {
    setUploads((prev) => prev.map((it) => (it.id === id ? { ...it, ...update } : it)));
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
      setUploads((prev) => [...prev, ...accepted]);
      for (const item of accepted) {
        probeFile(item.file, item.type).then((probe) => patch(item.id, probe));
      }
    },
    [patch],
  );

  async function runUpload(item: UploadItem) {
    const controller = new AbortController();
    controllers.current.set(item.id, controller);
    const { signal } = controller;
    const current = () => uploadsRef.current.find((it) => it.id === item.id) ?? item;

    try {
      patch(item.id, { status: "preparing", progress: 0, error: undefined });
      const auth = await requestJson<AuthorizeResponse>(
        "/api/upload/authorize",
        {
          albumId,
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
          // Poster is optional
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
    const queue = uploadsRef.current.filter((it) => ["queued", "failed", "cancelled"].includes(it.status));
    if (queue.length === 0) return;
    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (queue.length) {
        const next = queue.shift();
        if (next) await runUpload(next);
      }
    });
    await Promise.all(workers);
    const done = uploadsRef.current.filter((it) => it.status === "completed").length;
    if (done) toast.success(`${done} file${done === 1 ? "" : "s"} uploaded`);
    router.refresh();
  }

  function cancel(item: UploadItem) {
    controllers.current.get(item.id)?.abort();
    patch(item.id, { status: "cancelled" });
    if (item.uploadSessionId) {
      requestJson("/api/upload/cancel", { uploadSessionId: item.uploadSessionId }).catch(() => {});
    }
  }

  function remove(item: UploadItem) {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    setUploads((prev) => prev.filter((it) => it.id !== item.id));
  }

  function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files?.length) addFiles(event.dataTransfer.files);
  }

  const pendingCount = uploads.filter((it) => ["queued", "failed", "cancelled"].includes(it.status)).length;
  const activeCount = uploads.filter((it) => ["preparing", "uploading", "processing"].includes(it.status)).length;

  return (
    <section className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-medium">Items</h2>
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
          <UploadIcon data-icon="inline-start" /> Upload
        </Button>
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

      {/* Upload queue */}
      {uploads.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {uploads.length} file{uploads.length === 1 ? "" : "s"}
              {activeCount > 0 && ` · ${activeCount} in progress`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploads((prev) => prev.filter((it) => it.status !== "completed"))}
                disabled={!uploads.some((it) => it.status === "completed")}
              >
                Clear completed
              </Button>
              <Button size="sm" onClick={startAll} disabled={pendingCount === 0 || activeCount > 0}>
                <UploadCloudIcon data-icon="inline-start" />
                Upload {pendingCount > 0 ? `${pendingCount}` : ""}
              </Button>
            </div>
          </div>
          <ul className="flex flex-col gap-3">
            {uploads.map((item) => (
              <li key={item.id}>
                <UploadItemCard
                  item={item}
                  onChange={(update) => patch(item.id, update)}
                  onCancel={() => cancel(item)}
                  onRetry={() => runUpload(item)}
                  onRemove={() => remove(item)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Drop zone wrapping grid */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative rounded-xl transition-colors",
          dragging && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        )}
      >
        {/* Drag overlay */}
        {dragging && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-primary/10 backdrop-blur-sm">
            <UploadCloudIcon className="size-10 text-primary" />
            <p className="text-sm font-medium text-primary">Drop files to upload</p>
          </div>
        )}

        {mediaItems.length === 0 && uploads.length === 0 ? (
          <EmptyState
            title="This album is empty"
            description="Drag & drop files here or click Upload to add media."
          />
        ) : (
          <MediaGrid items={mediaItems} siteUrl={siteUrl} albumId={albumId} coverMediaId={coverMediaId} />
        )}
      </div>
    </section>
  );
}
