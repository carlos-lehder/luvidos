import { FilmIcon, ImageIcon, SettingsIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlbumGallery } from "@/components/album/album-gallery";
import { CopyLinkButton } from "@/components/media/copy-link-button";
import { EmptyState } from "@/components/media/empty-state";
import { ViewTracker } from "@/components/media/view-tracker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ALBUM_PAGE_MAX_ITEMS } from "@/lib/config/media";
import { albumService } from "@/lib/services/album.service";
import { mediaService } from "@/lib/services/media.service";
import { getCurrentUser } from "@/lib/supabase/server";
import { formatCount, getInitials } from "@/lib/utils/format";
import { absoluteUrl } from "@/lib/utils/site";

export async function generateMetadata({ params }: PageProps<"/album/[id]">): Promise<Metadata> {
  const { id } = await params;
  const album = await albumService.getDetail(id);
  if (!album) return { title: "Album not found", robots: { index: false } };

  const description = album.description ?? `${album.mediaCount} item${album.mediaCount === 1 ? "" : "s"} shared on Luvidos.`;
  return {
    title: album.title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: album.title,
      description,
      type: "website",
      url: absoluteUrl(`/album/${album.id}`),
      images: album.coverUrl ? [{ url: album.coverUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: album.title,
      description,
      images: album.coverUrl ? [album.coverUrl] : undefined,
    },
  };
}

export default async function AlbumPage({ params }: PageProps<"/album/[id]">) {
  const { id } = await params;
  const [album, user] = await Promise.all([albumService.getDetail(id), getCurrentUser()]);
  if (!album) notFound();

  const media = await mediaService.listByAlbum(album.id, { offset: 0, limit: ALBUM_PAGE_MAX_ITEMS });
  const isOwner = user?.id === album.ownerId;
  const ownerName = album.owner?.displayName ?? album.owner?.username;
  const shareUrl = absoluteUrl(`/album/${album.id}`);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <ViewTracker albumId={album.id} />

      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{album.title}</h1>
            {album.description && (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{album.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <CopyLinkButton url={shareUrl} title={album.title} />
            {isOwner && (
              <Button size="sm" variant="ghost" render={<Link href={`/dashboard/albums/${album.id}`} />}>
                <SettingsIcon data-icon="inline-start" /> Manage
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {album.owner && (
            <span className="inline-flex items-center gap-2">
              <Avatar size="sm">
                {album.owner.avatarUrl && <AvatarImage src={album.owner.avatarUrl} alt="" />}
                <AvatarFallback>{getInitials(ownerName)}</AvatarFallback>
              </Avatar>
              <span className="text-foreground/80">{ownerName}</span>
            </span>
          )}
          {album.imageCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <ImageIcon className="size-3.5" aria-hidden="true" /> {formatCount(album.imageCount)}
            </span>
          )}
          {album.videoCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <FilmIcon className="size-3.5" aria-hidden="true" /> {formatCount(album.videoCount)}
            </span>
          )}
        </div>
      </header>

      {media.items.length === 0 ? (
        <EmptyState
          title="This album is empty"
          description={isOwner ? "Upload photos or videos to fill it." : "Nothing has been shared here yet."}
          action={
            isOwner ? <Button render={<Link href={`/dashboard/upload?album=${album.id}`} />}>Upload</Button> : undefined
          }
        />
      ) : (
        <>
          <AlbumGallery items={media.items} />
          {media.total !== undefined && media.total > media.items.length && (
            <p className="text-center text-xs text-muted-foreground">
              Showing {media.items.length} of {media.total} items.
            </p>
          )}
        </>
      )}
    </div>
  );
}
