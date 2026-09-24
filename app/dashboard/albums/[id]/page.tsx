import { ArrowLeftIcon, ExternalLinkIcon, UploadIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlbumForm } from "@/components/dashboard/album-form";
import { DeleteAlbumButton } from "@/components/dashboard/delete-album-button";
import { MediaTable } from "@/components/dashboard/media-table";
import { Pagination } from "@/components/gallery/pagination";
import { EmptyState } from "@/components/media/empty-state";
import { VisibilityBadge } from "@/components/media/visibility-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PAGE_SIZE } from "@/lib/config/media";
import { albumService } from "@/lib/services/album.service";
import { mediaService } from "@/lib/services/media.service";
import { getCurrentUser } from "@/lib/supabase/server";
import { formatBytes, formatCount } from "@/lib/utils/format";
import { buildHref } from "@/lib/utils/href";
import { getSiteUrl } from "@/lib/utils/site";

export const metadata: Metadata = { title: "Manage album", robots: { index: false } };

export default async function ManageAlbumPage({ params, searchParams }: PageProps<"/dashboard/albums/[id]">) {
  const [{ id }, sp, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  if (!user) return null;

  const album = await albumService.getOwn(user.id, id);
  if (!album) notFound();

  const page = Math.max(1, Number(sp.page) || 1);
  const media = await mediaService.listOwn(user.id, {
    albumId: album.id,
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  });
  const base = `/dashboard/albums/${album.id}`;

  return (
    <>
      <div className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" className="w-fit" render={<Link href="/dashboard/albums" />}>
          <ArrowLeftIcon data-icon="inline-start" /> Back to albums
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">{album.title}</h1>
              <VisibilityBadge visibility={album.visibility} />
            </div>
            <p className="text-sm text-muted-foreground">
              {formatCount(album.mediaCount)} item{album.mediaCount === 1 ? "" : "s"} · {formatBytes(album.totalSize)} ·{" "}
              {formatCount(album.viewCount)} views
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" render={<Link href={`/album/${album.id}`} />}>
              <ExternalLinkIcon data-icon="inline-start" /> View
            </Button>
            <Button render={<Link href={`/dashboard/upload?album=${album.id}`} />}>
              <UploadIcon data-icon="inline-start" /> Upload to album
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-medium">Items</h2>
          {media.items.length === 0 ? (
            <EmptyState
              title="This album is empty"
              description="Upload images or videos to fill it."
              action={
                <Button render={<Link href={`/dashboard/upload?album=${album.id}`} />}>
                  <UploadIcon data-icon="inline-start" /> Upload media
                </Button>
              }
            />
          ) : (
            <>
              <MediaTable items={media.items} siteUrl={getSiteUrl()} albumId={album.id} coverMediaId={album.coverMediaId} />
              <Pagination
                page={page}
                hasNext={media.nextOffset !== null}
                total={media.total}
                pageSize={PAGE_SIZE}
                hrefFor={(p) => buildHref(base, { page: p })}
              />
            </>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Album settings</CardTitle>
              <CardDescription>Title, description, tags and who can see it.</CardDescription>
            </CardHeader>
            <CardContent>
              <AlbumForm album={album} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Danger zone</CardTitle>
              <CardDescription>Deleting an album removes every file inside it.</CardDescription>
            </CardHeader>
            <CardContent>
              <DeleteAlbumButton albumId={album.id} title={album.title} mediaCount={album.mediaCount} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
