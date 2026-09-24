import { ArrowLeftIcon, DownloadIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLinkButton } from "@/components/media/copy-link-button";
import { VideoPlayer } from "@/components/media/video-player";
import { ViewTracker } from "@/components/media/view-tracker";
import { Button } from "@/components/ui/button";
import { albumService } from "@/lib/services/album.service";
import { mediaService } from "@/lib/services/media.service";
import { formatBytes, formatDate, formatDuration } from "@/lib/utils/format";
import { absoluteUrl } from "@/lib/utils/site";

export async function generateMetadata({ params }: PageProps<"/media/[id]">): Promise<Metadata> {
  const { id } = await params;
  const media = await mediaService.getDetail(id);
  if (!media) return { title: "Media not found", robots: { index: false } };

  const image = media.thumbnailUrl ?? (media.type === "image" ? media.url : undefined);
  return {
    title: media.title,
    description: media.description ?? "Shared on Luvidos.",
    robots: { index: false, follow: false },
    openGraph: {
      title: media.title,
      type: media.type === "video" ? "video.other" : "article",
      url: absoluteUrl(`/media/${media.id}`),
      images: image ? [{ url: image, width: media.width ?? undefined, height: media.height ?? undefined }] : undefined,
      videos: media.type === "video" ? [{ url: media.url, type: media.mimeType }] : undefined,
    },
    twitter: {
      card: media.type === "video" ? "player" : "summary_large_image",
      title: media.title,
      images: image ? [image] : undefined,
    },
  };
}

export default async function MediaPage({ params }: PageProps<"/media/[id]">) {
  const { id } = await params;
  const media = await mediaService.getDetail(id);
  if (!media) notFound();
  const album = await albumService.getDetail(media.albumId);

  const ratio = media.width && media.height ? media.width / media.height : 16 / 9;
  const meta = [
    media.type === "video"
      ? formatDuration(media.duration)
      : media.width && media.height
        ? `${media.width} × ${media.height}`
        : null,
    formatBytes(media.fileSize),
    formatDate(media.createdAt),
  ].filter(Boolean);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-8 sm:px-6">
      {media.status === "ready" && <ViewTracker mediaId={media.id} />}

      {album && (
        <Link
          href={`/album/${album.id}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" /> {album.title}
        </Link>
      )}

      {media.status !== "ready" ? (
        <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
          {media.status === "failed" ? "Processing failed for this file." : "This file is still processing…"}
        </div>
      ) : media.type === "video" ? (
        <div className="aspect-video overflow-hidden rounded-xl bg-black">
          <VideoPlayer src={media.url} poster={media.thumbnailUrl} mimeType={media.mimeType} title={media.title} />
        </div>
      ) : (
        <div
          className="relative w-full overflow-hidden rounded-xl bg-muted"
          style={{ aspectRatio: ratio, maxHeight: "80vh" }}
        >
          <Image
            src={media.url}
            alt={media.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-contain"
          />
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight text-balance">{media.title}</h1>
          <p className="text-xs text-muted-foreground">{meta.join(" · ")}</p>
          {media.description && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground whitespace-pre-wrap">{media.description}</p>
          )}
        </div>
        {media.status === "ready" && (
          <div className="flex items-center gap-2">
            <CopyLinkButton url={absoluteUrl(`/media/${media.id}`)} title={media.title} />
            <Button size="sm" variant="ghost" render={<a href={`/api/media/${media.id}/download`} />}>
              <DownloadIcon data-icon="inline-start" /> Download
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
