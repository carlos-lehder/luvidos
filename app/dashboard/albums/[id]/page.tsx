import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlbumForm } from "@/components/dashboard/album-form";
import { AlbumItemsSection } from "@/components/dashboard/album-items-section";
import { DeleteAlbumButton } from "@/components/dashboard/delete-album-button";
import { Pagination } from "@/components/gallery/pagination";
import { CopyLinkButton } from "@/components/media/copy-link-button";
import { VisibilityBadge } from "@/components/media/visibility-badge";
import { Button } from "@/components/ui/button";
import { Collapsible } from "@/components/ui/collapsible";
import { PAGE_SIZE } from "@/lib/config/media";
import { albumService } from "@/lib/services/album.service";
import { mediaService } from "@/lib/services/media.service";
import { getCurrentUser } from "@/lib/supabase/server";
import { formatBytes, formatCount } from "@/lib/utils/format";
import { buildHref } from "@/lib/utils/href";
import { absoluteUrl, getSiteUrl } from "@/lib/utils/site";

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
          <div className="flex flex-row gap-4">
          <CopyLinkButton url={absoluteUrl(`/album/${album.id}`)} title={album.title} />
          <Button variant="outline" render={<Link href={`/album/${album.id}`} />}>
            <ExternalLinkIcon data-icon="inline-start" /> View
          </Button>
           <DeleteAlbumButton albumId={album.id} title={album.title} mediaCount={album.mediaCount} />
          </div>
        </div>
      </div>

      {/* Album settings */}
      <Collapsible title="Album settings" description="Title, description and who can see it.">
        <AlbumForm album={album} />
      </Collapsible>

      {/* Items + Upload */}
      <AlbumItemsSection
        albumId={album.id}
        items={media.items}
        siteUrl={getSiteUrl()}
        coverMediaId={album.coverMediaId}
      />
      <Pagination
        page={page}
        hasNext={media.nextOffset !== null}
        total={media.total}
        pageSize={PAGE_SIZE}
        hrefFor={(p) => buildHref(base, { page: p })}
      />
    </>
  );
}
