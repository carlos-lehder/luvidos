"use client";

import Link from "next/link";

export function AdBanner() {
  return (
    <div className="bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 border border-fuchsia-500/30 rounded-lg">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-white">
            Earn passive income with our network
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Join thousands of publishers monetizing their content
          </p>
        </div>
        <Link
          href="https://www.profitableratecpmnetwork.com/iyskdnjdt?key=35d1c6a74aa6f8969336674e809af149"
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="shrink-0 rounded-lg bg-fuchsia-500 px-4 py-2 text-xs font-semibold text-white hover:bg-fuchsia-600 transition-colors"
        >
          Learn More
        </Link>
      </div>
    </div>
  );
}
