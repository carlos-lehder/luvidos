import { EyeIcon, FilmIcon, FolderIcon, FolderPlusIcon, HardDriveIcon, ImageIcon, UploadIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlbumGrid, AlbumGridSkeleton } from "@/components/album/album-grid";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/media/empty-state";
import { Button } from "@/components/ui/button";
import { albumService } from "@/lib/services/album.service";
import { userService } from "@/lib/services/user.service";
import { getCurrentUser } from "@/lib/supabase/server";
import { formatBytes, formatCount } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardPage() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">Your library at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href="/dashboard/albums/new" />}>
            <FolderPlusIcon data-icon="inline-start" /> New album
          </Button>
          <Button render={<Link href="/dashboard/upload" />}>
            <UploadIcon data-icon="inline-start" /> Upload
          </Button>
        </div>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-medium">Recent albums</h2>
          <Button variant="ghost" size="sm" render={<Link href="/dashboard/albums" />}>
            View all
          </Button>
        </div>
        <Suspense fallback={<AlbumGridSkeleton count={8} />}>
          <RecentAlbums />
        </Suspense>
      </section>
    </>
  );
}

async function Stats() {
  const stats = await userService.getDashboardStats();
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard icon={FolderIcon} label="Albums" value={formatCount(stats.total_albums)} />
      <StatCard icon={ImageIcon} label="Images" value={formatCount(stats.total_images)} />
      <StatCard icon={FilmIcon} label="Videos" value={formatCount(stats.total_videos)} />
      <StatCard icon={EyeIcon} label="Total views" value={formatCount(stats.total_views)} />
      <StatCard icon={HardDriveIcon} label="Storage used" value={formatBytes(stats.storage_bytes)} />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

async function RecentAlbums() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { items } = await albumService.listOwn(user.id, { limit: 8 });

  if (items.length === 0) {
    return (
      <EmptyState
        icon={FolderIcon}
        title="No albums yet"
        description="Create an album, then upload your first images or videos into it."
        action={
          <Button render={<Link href="/dashboard/albums/new" />}>
            <FolderPlusIcon data-icon="inline-start" /> Create album
          </Button>
        }
      />
    );
  }
  return (
    <AlbumGrid
      items={items}
      showVisibility
      className="xl:grid-cols-4 2xl:grid-cols-4"
      hrefFor={(a) => `/dashboard/albums/${a.id}`}
    />
  );
}
