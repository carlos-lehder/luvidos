"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";

const NO_ADS_PATHS = ["/login", "/signup", "/dashboard"];

function isNoAdsPath(pathname: string) {
  return NO_ADS_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function AdblockDetector() {
  const [blocked, setBlocked] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (isNoAdsPath(pathname)) return;
    // ponytail: bait-element detection — upgrade to fetch-based check if false positives arise
    const bait = document.createElement("div");
    bait.className =
      "ad_unit ad-zone ad-banner textads banner-ads pub_300x250 adsbox";
    bait.style.cssText =
      "position:absolute;top:-10px;left:-10px;width:1px;height:1px;overflow:hidden;";
    document.body.appendChild(bait);

    // Also try fetching a typical ad script path
    const timer = setTimeout(() => {
      const baitBlocked =
        bait.offsetHeight === 0 ||
        bait.offsetParent === null ||
        getComputedStyle(bait).display === "none";

      if (baitBlocked) {
        setBlocked(true);
      } else {
        // Secondary check: try fetching a URL pattern ad blockers typically block
        fetch(
          "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
          {
            method: "HEAD",
            mode: "no-cors",
          }
        ).catch(() => {
          setBlocked(true);
        });
      }
      bait.remove();
    }, 1000);

    return () => {
      clearTimeout(timer);
      bait.remove();
    };
  }, [pathname]);

  if (!blocked || isNoAdsPath(pathname)) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-2xl border border-red-500/30 bg-popover p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <ShieldAlert className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-white">
          Ad Blocker Detected
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          This website is supported by ads. Please disable your ad blocker to
          continue, or use a different browser without ad blocking extensions.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-lg bg-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-fuchsia-600"
          >
            I&apos;ve Disabled It — Reload Page
          </button>
          <p className="text-xs text-muted-foreground/60">
            After disabling your ad blocker, click the button above to reload
            the page.
          </p>
        </div>
      </div>
    </div>
  );
}
