import { FilmIcon, FolderIcon, ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { VisibilityBadge } from "@/components/media/visibility-badge";
import { cn } from "@/lib/utils";
import { formatCount, formatRelative } from "@/lib/utils/format";
import type { AlbumItem } from "@/types/media";

/** Album tile for the owner's dashboard. */
export function AlbumCard({
  album,
  priority = false,
  showVisibility = false,
  href,
  className,
}: {
  album: AlbumItem;
  priority?: boolean;
  showVisibility?: boolean;
  href?: string;
  className?: string;
}) {
  const target = href ?? `/album/${album.id}`;

  return (
    <article className={cn("group/card flex flex-col gap-2", className)}>
      <Link
        href={target}
        className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10 transition-shadow outline-none focus-visible:ring-3 focus-visible:ring-ring/50 group-hover/card:shadow-md"
        aria-label={album.title}
      >
        {album.coverUrl ? (
          <Image
            src={album.coverUrl}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover/card:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-linear-to-br from-primary/20 via-muted to-muted text-muted-foreground">
            <FolderIcon className="size-10" />
          </div>
        )}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/60 to-transparent" />
        {showVisibility && (
          <span className="absolute top-2 left-2">
            <VisibilityBadge visibility={album.visibility} />
          </span>
        )}
        <span className="absolute right-2 bottom-2 flex items-center gap-1.5 text-xs font-medium text-white">
          {album.imageCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 tabular-nums">
              <ImageIcon className="size-3" aria-hidden="true" /> {formatCount(album.imageCount)}
            </span>
          )}
          {album.videoCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 tabular-nums">
              <FilmIcon className="size-3" aria-hidden="true" /> {formatCount(album.videoCount)}
            </span>
          )}
        </span>
      </Link>

      <div className="flex flex-col gap-0.5 px-0.5">
        <Link href={target} className="line-clamp-1 text-sm font-medium hover:underline" tabIndex={-1}>
          {album.title}
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{album.mediaCount === 0 ? "Empty" : `${formatCount(album.mediaCount)} item${album.mediaCount === 1 ? "" : "s"}`}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={album.updatedAt}>{formatRelative(album.updatedAt)}</time>
        </div>
      </div>
    </article>
  );
}
