import { SITE_NAME, SITE_TAGLINE } from "@/lib/config/media";

export function getSiteUrl() {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return url.replace(/\/$/, "");
}

export function absoluteUrl(path: string) {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageTitle(title?: string) {
  return title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`;
}
