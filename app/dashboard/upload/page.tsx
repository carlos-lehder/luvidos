import type { Metadata } from "next";
import { Suspense } from "react";
import { Uploader } from "@/components/upload/uploader";
import { albumService } from "@/lib/services/album.service";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Upload", robots: { index: false } };

export default async function UploadPage({ searchParams }: PageProps<"/dashboard/upload">) {
  const [user, sp] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) return null;

  const albums = await albumService.listOwnOptions(user.id);
  const requested = typeof sp.album === "string" ? sp.album : null;
  const initialAlbumId = requested && albums.some((a) => a.id === requested) ? requested : null;

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Upload</h1>
        <p className="text-sm text-muted-foreground">
          Pick an album, then drop your files. They are uploaded directly from your browser to secure cloud storage.
        </p>
      </div>
      <Suspense>
        <Uploader albums={albums} initialAlbumId={initialAlbumId} />
      </Suspense>
    </>
  );
}
