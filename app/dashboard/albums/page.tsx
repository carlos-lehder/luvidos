import { FolderIcon, FolderPlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AlbumGrid } from "@/components/album/album-grid";
import { Pagination } from "@/components/gallery/pagination";
import { EmptyState } from "@/components/media/empty-state";
import { Button } from "@/components/ui/button";
import { PAGE_SIZE } from "@/lib/config/media";
import { albumService } from "@/lib/services/album.service";
import { getCurrentUser } from "@/lib/supabase/server";
import { buildHref } from "@/lib/utils/href";

export const metadata: Metadata = { title: "Albums", robots: { index: false } };

export default async function AlbumsPage({ searchParams }: PageProps<"/dashboard/albums">) {
  const user = await getCurrentUser();
  if (!user) return null;

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const result = await albumService.listOwn(user.id, { offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Albums</h1>
          <p className="text-sm text-muted-foreground">
            {result.total ?? 0} album{result.total === 1 ? "" : "s"}
          </p>
        </div>
        <Button render={<Link href="/dashboard/albums/new" />}>
          <FolderPlusIcon data-icon="inline-start" /> New album
        </Button>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          icon={FolderIcon}
          title="No albums yet"
          description="Albums are what you share. Create one and start uploading into it."
          action={
            <Button render={<Link href="/dashboard/albums/new" />}>
              <FolderPlusIcon data-icon="inline-start" /> Create album
            </Button>
          }
        />
      ) : (
        <>
          <AlbumGrid items={result.items} showVisibility hrefFor={(a) => `/dashboard/albums/${a.id}`} />
          <Pagination
            page={page}
            hasNext={result.nextOffset !== null}
            total={result.total}
            pageSize={PAGE_SIZE}
            hrefFor={(p) => buildHref("/dashboard/albums", { page: p })}
          />
        </>
      )}
    </>
  );
}
