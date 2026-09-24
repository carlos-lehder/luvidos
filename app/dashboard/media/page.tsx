import { UploadIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MediaTable } from "@/components/dashboard/media-table";
import { Pagination } from "@/components/gallery/pagination";
import { EmptyState } from "@/components/media/empty-state";
import { Button } from "@/components/ui/button";
import { PAGE_SIZE } from "@/lib/config/media";
import { albumService } from "@/lib/services/album.service";
import { mediaService } from "@/lib/services/media.service";
import { getCurrentUser } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/utils/site";
import { buildHref } from "@/lib/utils/href";
import { cn } from "@/lib/utils";
import type { MediaType } from "@/types/database";

export const metadata: Metadata = { title: "My Media", robots: { index: false } };

const TYPE_TABS: { value: "all" | MediaType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
];

export default async function MyMediaPage({ searchParams }: PageProps<"/dashboard/media">) {
  const user = await getCurrentUser();
  if (!user) return null;

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const type = sp.type === "image" || sp.type === "video" ? sp.type : "all";

  const [result, albums] = await Promise.all([
    mediaService.listOwn(user.id, {
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
      type: type === "all" ? null : type,
    }),
    albumService.listOwnOptions(user.id),
  ]);
  const albumNames = Object.fromEntries(albums.map((a) => [a.id, a.title]));
  const base = "/dashboard/media";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">My Media</h1>
          <p className="text-sm text-muted-foreground">
            {result.total ?? 0} item{result.total === 1 ? "" : "s"} across all albums
          </p>
        </div>
        <Button render={<Link href="/dashboard/upload" />}>
          <UploadIcon data-icon="inline-start" /> Upload
        </Button>
      </div>

      <div className="inline-flex h-9 w-fit items-center rounded-lg bg-muted p-1" role="tablist" aria-label="Filter by type">
        {TYPE_TABS.map((t) => (
          <Link
            key={t.value}
            role="tab"
            aria-selected={t.value === type}
            href={buildHref(base, { type: t.value })}
            className={cn(
              "inline-flex h-full items-center rounded-md px-3 text-sm font-medium transition-colors",
              t.value === type ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          title="No media yet"
          description="Upload your first image or video to get started."
          action={
            <Button render={<Link href="/dashboard/upload" />}>
              <UploadIcon data-icon="inline-start" /> Upload media
            </Button>
          }
        />
      ) : (
        <>
          <MediaTable items={result.items} siteUrl={getSiteUrl()} albumNames={albumNames} />
          <Pagination
            page={page}
            hasNext={result.nextOffset !== null}
            total={result.total}
            pageSize={PAGE_SIZE}
            hrefFor={(p) => buildHref(base, { type, page: p })}
          />
        </>
      )}
    </>
  );
}
