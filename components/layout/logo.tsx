import Link from "next/link";
import { LogoMark } from "@/components/layout/logo-mark";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/config/media";

export function Logo({
  className,
  compact = false,
  id,
}: {
  className?: string;
  compact?: boolean;
  /** Pass a unique id when rendering more than one Logo on the same page. */
  id?: string;
}) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 font-heading font-semibold tracking-tight", className)}
      aria-label={`${SITE_NAME} home`}
    >
      <LogoMark className="size-8" id={id} />
      {!compact && (
        <span className="text-lg">
          <span className="text-fuchsia-300">Luv</span>idos
        </span>
      )}
    </Link>
  );
}
