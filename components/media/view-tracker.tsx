"use client";

import { useEffect } from "react";

/** Records a view once per session; the server RPC enforces access rules. */
export function ViewTracker({ mediaId, albumId }: { mediaId?: string; albumId?: string }) {
  useEffect(() => {
    const kind = mediaId ? "media" : "album";
    const id = mediaId ?? albumId;
    if (!id) return;
    const key = `luvidos:viewed:${kind}:${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch(`/api/${kind}/${id}/view`, { method: "POST", keepalive: true }).catch(() => {});
  }, [mediaId, albumId]);
  return null;
}
