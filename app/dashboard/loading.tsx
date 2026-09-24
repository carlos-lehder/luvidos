import { StatCardSkeleton } from "@/components/dashboard/stat-card";
import { AlbumGridSkeleton } from "@/components/album/album-grid";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <AlbumGridSkeleton count={8} />
    </>
  );
}
