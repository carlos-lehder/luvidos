import { cn } from "@/lib/utils";

/** Heart-Play brand mark. Uses a unique gradient id so several instances can coexist on a page. */
export function LogoMark({ className, id = "luvidos-mark" }: { className?: string; id?: string }) {
  const gradientId = `${id}-g`;
  return (
    <svg viewBox="0 0 64 64" className={cn("size-8", className)} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F0ABFC" />
          <stop offset="1" stopColor="#A21CAF" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradientId})`}
        fillRule="evenodd"
        d="M32 55C14 42 8 31 12 22c3-7 12-9 17-4l3 3 3-3c5-5 14-3 17 4c4 9-2 20-20 33zM27 27v18l15-9z"
      />
    </svg>
  );
}
