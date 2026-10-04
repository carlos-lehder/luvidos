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
        src="https://pl31487610.profitableratecpmnetwork.com/0e/09/9f/0e099fd2377452a4b795c082db932510.js"
        strategy="lazyOnload"
      />
      <Script
        src="https://pl31487611.profitableratecpmnetwork.com/31/74/fd/3174fd6c41ad86c4a2e11d58eaa72618.js"
        strategy="lazyOnload"
      />
    </>
  );
}
