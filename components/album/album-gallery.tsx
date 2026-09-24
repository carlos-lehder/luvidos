"use client";

import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, FilmIcon, PlayIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { VideoPlayer } from "@/components/media/video-player";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils/format";
import type { MediaItem } from "@/types/media";

/** Minimal shared-album gallery: tight grid + full-screen lightbox with keyboard navigation. */
export function AlbumGallery({ items, allowDownload = true }: { items: MediaItem[]; allowDownload?: boolean }) {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;
  const current = index !== null ? items[index] : null;

  const step = useCallback(
    (delta: number) => {
      setIndex((i) => (i === null ? i : (i + delta + items.length) % items.length));
    },
    [items.length],
  );

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  return (
    <>
      <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 lg:grid-cols-5">
        {items.map((media, i) => {
          const thumb = media.thumbnailUrl ?? (media.type === "image" ? media.url : null);
          const duration = formatDuration(media.duration);
          return (
            <li key={media.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                className="group relative block aspect-square w-full overflow-hidden rounded-lg bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
                aria-label={`Open ${media.title}`}
              >
                {thumb ? (
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    priority={i < 8}
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-muted-foreground">
                    <FilmIcon className="size-8" />
                  </span>
                )}
                {media.type === "video" && (
                  <>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex size-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-transform group-hover:scale-110">
                        <PlayIcon className="ml-0.5 size-4 fill-current" />
                      </span>
                    </span>
                    {duration && (
                      <span className="absolute right-1.5 bottom-1.5 rounded bg-black/70 px-1 py-0.5 text-[10px] font-medium text-white tabular-nums">
                        {duration}
                      </span>
                    )}
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog open={open} onOpenChange={(o) => !o && setIndex(null)}>
        <DialogContent
          showCloseButton={false}
          className="h-dvh max-h-dvh w-screen max-w-none rounded-none border-0 bg-black/95 p-0 ring-0 sm:max-w-none"
        >
          {current && (
            <div className="relative flex h-full flex-col">
              <DialogTitle className="sr-only">{current.title}</DialogTitle>

              <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 p-3 text-white">
                <span className="rounded-md bg-black/40 px-2 py-1 text-xs tabular-nums backdrop-blur">
                  {index! + 1} / {items.length}
                </span>
                <div className="flex items-center gap-1">
                  {allowDownload && current.status === "ready" && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-white hover:bg-white/10 hover:text-white"
                      render={<a href={`/api/media/${current.id}/download`} />}
                      aria-label="Download"
                    >
                      <DownloadIcon />
                    </Button>
                  )}
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-white hover:bg-white/10 hover:text-white"
                    onClick={() => setIndex(null)}
                    aria-label="Close"
                  >
                    <XIcon />
                  </Button>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-center p-2 sm:p-10">
                {current.type === "video" ? (
                  <div className="aspect-video w-full max-w-6xl overflow-hidden rounded-lg bg-black">
                    <VideoPlayer
                      key={current.id}
                      src={current.url}
                      poster={current.thumbnailUrl}
                      mimeType={current.mimeType}
                      title={current.title}
                    />
                  </div>
                ) : (
                  <div className="relative size-full">
                    <Image
                      key={current.id}
                      src={current.url}
                      alt={current.title}
                      fill
                      priority
                      sizes="100vw"
                      className="object-contain"
                    />
                  </div>
                )}
              </div>

              {items.length > 1 && (
                <>
                  <NavButton side="left" onClick={() => step(-1)} />
                  <NavButton side="right" onClick={() => step(1)} />
                </>
              )}

              <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/70 to-transparent p-4 pt-10 text-center text-white">
                <p className="truncate text-sm font-medium">{current.title}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous" : "Next"}
      className={cn(
        "absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60 focus-visible:ring-3 focus-visible:ring-white/50 outline-none",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
