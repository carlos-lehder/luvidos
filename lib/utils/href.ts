/** Builds `base?key=value` from a params object, skipping empty/"all"/page 1. */
export function buildHref(base: string, params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === "all") continue;
    if (key === "page" && Number(value) <= 1) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}
