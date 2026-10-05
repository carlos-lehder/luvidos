"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const NO_ADS_PATHS = ["/login", "/signup", "/dashboard"];

function isNoAdsPath(pathname: string) {
  return NO_ADS_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function AdScripts() {
  const pathname = usePathname();
  if (isNoAdsPath(pathname)) return null;

  return (
    <>
      <Script
        src="https://pl31667523.profitableratecpmnetwork.com/e3/24/76/e324765c2627d86d51d93b60fe56c0d1.js"
        strategy="lazyOnload"
      />
      <Script
        src="https://pl31667525.profitableratecpmnetwork.com/bd/31/fa/bd31faf5ccba56fad7c4f16efa65aad4.js"
        strategy="lazyOnload"
      />
    </>
  );
}
