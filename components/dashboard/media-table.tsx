"use client";

import {
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FilmIcon,
  ImageIcon,
  MoreHorizontalIcon,
  PencilIcon,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBytes, formatCount, formatDate } from "@/lib/utils/format";
import type { MediaItem } from "@/types/media";

export function MediaTable({
  items,
  siteUrl,
  albumNames,
  coverMediaId,
  albumId,
}: {
  items: MediaItem[];
  siteUrl: string;
  /** Optional map albumId → title, shows an Album column. */
  albumNames?: Record<string, string>;
  /** When managing a single album, enables the "Set as cover" action. */
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
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-64">Media</TableHead>
              {albumNames && <TableHead className="hidden md:table-cell">Album</TableHead>}
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden sm:table-cell">Size</TableHead>
              <TableHead className="hidden sm:table-cell">Views</TableHead>
              <TableHead className="hidden lg:table-cell">Uploaded</TableHead>
              <TableHead className="w-12 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((media) => {
              const thumb = media.thumbnailUrl ?? (media.type === "image" ? media.url : null);
              const isCover = coverMediaId === media.id;
              return (
                <TableRow key={media.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/media/${media.id}`}
                        className="relative block size-12 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10"
                        aria-label={`View ${media.title}`}
                      >
                        {thumb ? (
                          <Image src={thumb} alt="" fill sizes="48px" className="object-cover" />
                        ) : (
                          <span className="flex size-full items-center justify-center text-muted-foreground">
                            {media.type === "video" ? <FilmIcon className="size-4" /> : <ImageIcon className="size-4" />}
                          </span>
                        )}
                      </Link>
                      <div className="flex min-w-0 flex-col">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/media/${media.id}`} className="truncate font-medium hover:underline">
                            {media.title}
                          </Link>
                          {isCover && (
                            <Badge variant="secondary" className="shrink-0">
                              <StarIcon /> Cover
                            </Badge>
                          )}
                        </div>
                        <span className="truncate text-xs text-muted-foreground">{media.fileName}</span>
                        {media.status !== "ready" && (
                          <Badge variant={media.status === "failed" ? "destructive" : "secondary"} className="mt-1 w-fit capitalize">
                            {media.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  {albumNames && (
                    <TableCell className="hidden md:table-cell">
                      <Link href={`/dashboard/albums/${media.albumId}`} className="truncate hover:underline">
                        {albumNames[media.albumId] ?? "—"}
                      </Link>
                    </TableCell>
                  )}
                  <TableCell className="hidden capitalize md:table-cell">{media.type}</TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">{formatBytes(media.fileSize)}</TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">{formatCount(media.viewCount)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate(media.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon-sm" />}
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
                        {media.status === "ready" && (
                          <DropdownMenuItem render={<a href={`/api/media/${media.id}/download`} />}>
                            <DownloadIcon /> Download
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => setPendingDelete(media)}>
                          <Trash2Icon /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.title}”?</AlertDialogTitle>
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
