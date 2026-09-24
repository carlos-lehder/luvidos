import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditMediaForm } from "@/components/dashboard/edit-media-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mediaService } from "@/lib/services/media.service";
import { getCurrentUser } from "@/lib/supabase/server";
import { formatBytes } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Edit media", robots: { index: false } };

export default async function EditMediaPage({ params }: PageProps<"/dashboard/media/[id]/edit">) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const media = await mediaService.getOwn(user.id, id);
  if (!media) notFound();

  const thumb = media.thumbnailUrl ?? (media.type === "image" ? media.url : null);

  return (
    <>
      <div className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" className="w-fit" render={<Link href={`/dashboard/albums/${media.albumId}`} />}>
          <ArrowLeftIcon data-icon="inline-start" /> Back to album
        </Button>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Edit media</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardContent>
            <EditMediaForm media={media} />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="flex flex-col gap-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
              {thumb && <Image src={thumb} alt="" fill sizes="320px" className="object-cover" />}
            </div>
            <dl className="grid gap-1 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">File</dt>
                <dd className="truncate font-medium">{media.fileName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Size</dt>
                <dd className="font-medium">{formatBytes(media.fileSize)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">{media.mimeType}</dd>
              </div>
            </dl>
            <Button variant="outline" render={<Link href={`/media/${media.id}`} />}>
              View public page
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
