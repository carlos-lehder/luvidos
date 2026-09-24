"use client";

import { cn } from "@/lib/utils";

/**
 * Streams straight from Azure Blob Storage (or a CDN in front of it).
 * Azure serves HTTP range requests natively, so seeking works for large files.
 */
export function VideoPlayer({
  src,
  poster,
  mimeType,
  title,
  className,
}: {
  src: string;
  poster?: string | null;
  mimeType: string;
  title: string;
  className?: string;
}) {
  return (
    <video
      className={cn("size-full bg-black", className)}
      controls
      playsInline
      preload="metadata"
      poster={poster ?? undefined}
      controlsList="nodownload"
      aria-label={title}
    >
      <source src={src} type={mimeType === "video/quicktime" ? "video/mp4" : mimeType} />
      Your browser does not support HTML video.
    </video>
  );
}
