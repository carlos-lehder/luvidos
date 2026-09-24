import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AlbumForm } from "@/components/dashboard/album-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "New album", robots: { index: false } };

export default function NewAlbumPage() {
  return (
    <>
      <div className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" className="w-fit" render={<Link href="/dashboard/albums" />}>
          <ArrowLeftIcon data-icon="inline-start" /> Back to albums
        </Button>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">New album</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Album details</CardTitle>
          <CardDescription>
            An album is a folder your visitors browse. You can upload into it right after creating it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlbumForm redirectTo="upload" submitLabel="Create & upload" />
        </CardContent>
      </Card>
    </>
  );
}
