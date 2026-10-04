"use client";

import {
  CopyIcon,
  ExternalLinkIcon,
  FilmIcon,
  ImageIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlayIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setAlbumCoverAction } from "@/app/actions/album";
import { deleteMediaAction } from "@/app/actions/media";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatBytes, formatDuration } from "@/lib/utils/format";
import type { MediaItem } from "@/types/media";

export function MediaGrid({
  items,
  siteUrl,
  coverMediaId,
  albumId,
}: {
  items: MediaItem[];
  siteUrl: string;
  coverMediaId?: string | null;
  albumId?: string;
}) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);
  const [isBusy, start] = useTransition();

  function copyLink(media: MediaItem) {
    navigator.clipboard
      .writeText(`${siteUrl}/media/${media.id}`)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Could not copy link"));
  }

  function setCover(media: MediaItem) {
    if (!albumId) return;
    start(async () => {
      const result = await setAlbumCoverAction(albumId, media.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.success);
        router.refresh();
      }
    });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    start(async () => {
      const result = await deleteMediaAction(target.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Media deleted");
        router.refresh();
      }
      setPendingDelete(null);
    });
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((media) => {
          const thumb = media.thumbnailUrl ?? (media.type === "image" ? media.url : null);
          const isCover = coverMediaId === media.id;
          const duration = media.type === "video" ? formatDuration(media.duration) : null;

          return (
            <div
              key={media.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-foreground/20"
            >
              {/* Thumbnail */}
              <Link
                href={`/media/${media.id}`}
                className="relative block aspect-square overflow-hidden bg-muted"
                aria-label={`View ${media.title}`}
              >
                {thumb ? (
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-muted-foreground">
                    {media.type === "video" ? <FilmIcon className="size-8" /> : <ImageIcon className="size-8" />}
                  </span>
                )}
                {/* Video duration badge */}
                {media.type === "video" && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex size-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
                      <PlayIcon className="ml-0.5 size-4 fill-current" />
                    </span>
                  </span>
                )}
                {duration && (
                  <span className="absolute right-1.5 bottom-1.5 rounded bg-black/70 px-1 py-0.5 text-[10px] font-medium text-white tabular-nums">
                    {duration}
                  </span>
                )}
                {/* Cover badge */}
                {isCover && (
                  <Badge variant="secondary" className="absolute top-1.5 left-1.5">
                    <StarIcon /> Cover
                  </Badge>
                )}
                {/* Status badge */}
                {media.status !== "ready" && (
                  <Badge
                    variant={media.status === "failed" ? "destructive" : "secondary"}
                    className="absolute top-1.5 right-1.5 capitalize"
                  >
                    {media.status}
                  </Badge>
                )}
              </Link>

              {/* Info */}
              <div className="flex items-center gap-1.5 p-2">
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link href={`/media/${media.id}`} className="truncate text-sm font-medium hover:underline">
                    {media.title}
                  </Link>
                  <span className="text-[11px] text-muted-foreground">{formatBytes(media.fileSize)}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon-sm" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    aria-label={`Actions for ${media.title}`}
                  >
                    <MoreHorizontalIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem render={<Link href={`/media/${media.id}`} />}>
                      <ExternalLinkIcon /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href={`/dashboard/media/${media.id}/edit`} />}>
                      <PencilIcon /> Edit
                    </DropdownMenuItem>
                    {albumId && media.status === "ready" && !isCover && (
                      <DropdownMenuItem onClick={() => setCover(media)}>
                        <StarIcon /> Set as cover
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => copyLink(media)}>
                      <CopyIcon /> Copy link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => setPendingDelete(media)}>
                      <Trash2Icon /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{pendingDelete?.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the file and its metadata. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete} disabled={isBusy}>
              {isBusy ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
