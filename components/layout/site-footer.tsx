import { LogoMark } from "@/components/layout/logo-mark";
import { SITE_NAME } from "@/lib/config/media";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6 text-xs text-muted-foreground sm:px-6">
        <span className="inline-flex items-center gap-2">
          <LogoMark className="size-4" id="footer-mark" />
          {SITE_NAME}
        </span>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
