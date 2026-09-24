import Link from "next/link";
import { LogoMark } from "@/components/layout/logo-mark";
import { SITE_NAME } from "@/lib/config/media";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
        {/* Sponsored Link */}
        <div className="flex items-center justify-center">
          <Link
            href="https://www.profitableratecpmnetwork.com/iyskdnjdt?key=35d1c6a74aa6f8969336674e809af149"
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="rounded-lg bg-fuchsia-500/10 px-3 py-2 text-xs font-medium text-fuchsia-300 hover:bg-fuchsia-500/20 transition-colors"
          >
            ✨ Discover More Ways to Earn
          </Link>
        </div>
        
        {/* Footer Content */}
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <LogoMark className="size-4" id="footer-mark" />
            {SITE_NAME}
          </span>
          <span className="text-xs text-muted-foreground">© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
