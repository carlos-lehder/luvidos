import { AlbumCard } from "@/components/album/album-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AlbumItem } from "@/types/media";

const GRID_CLASS = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

export function AlbumGrid({
  items,
  showVisibility,
  className,
  priorityCount = 0,
  hrefFor,
}: {
  items: AlbumItem[];
  showVisibility?: boolean;
  className?: string;
  priorityCount?: number;
  hrefFor?: (album: AlbumItem) => string;
}) {
  return (
    <div className={cn(GRID_CLASS, className)}>
      {items.map((album, i) => (
        <AlbumCard
          key={album.id}
          album={album}
          priority={i < priorityCount}
          showVisibility={showVisibility}
          href={hrefFor?.(album)}
        />
      ))}
    </div>
  );
}

export function AlbumGridSkeleton({ count = 12, className }: { count?: number; className?: string }) {
  return (
    <div className={cn(GRID_CLASS, className)} aria-busy="true" aria-label="Loading albums">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
