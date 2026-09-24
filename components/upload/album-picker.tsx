"use client";

import { FolderPlusIcon, GlobeIcon, LinkIcon, LockIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AlbumForm } from "@/components/dashboard/album-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MediaVisibility } from "@/types/media";

export interface AlbumOption {
  id: string;
  title: string;
  visibility: MediaVisibility;
}

const ICONS: Record<MediaVisibility, typeof GlobeIcon> = {
  public: GlobeIcon,
  unlisted: LinkIcon,
  private: LockIcon,
};

export function AlbumPicker({
  albums,
  value,
  onChange,
  disabled,
}: {
  albums: AlbumOption[];
  value: string | null;
  onChange: (albumId: string) => void;
  disabled?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  function onCreated(albumId: string) {
    setOpen(false);
    const next = new URLSearchParams(params);
    next.set("album", albumId);
    router.replace(`/dashboard/upload?${next}`);
    onChange(albumId);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="upload-album">Upload to album</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={value ?? undefined}
          onValueChange={(v) => v && onChange(v)}
          disabled={disabled || albums.length === 0}
          items={albums.map((a) => ({ value: a.id, label: a.title }))}
        >
          <SelectTrigger id="upload-album" className="min-w-64 flex-1 sm:flex-none">
            <SelectValue placeholder={albums.length ? "Choose an album…" : "No albums yet"} />
          </SelectTrigger>
          <SelectContent>
            {albums.map((album) => {
              const Icon = ICONS[album.visibility];
              return (
                <SelectItem key={album.id} value={album.id}>
                  <Icon className="text-muted-foreground" />
                  {album.title}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="outline" disabled={disabled} />}>
            <FolderPlusIcon data-icon="inline-start" /> New album
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New album</DialogTitle>
              <DialogDescription>Only people with the album link can see what you upload.</DialogDescription>
            </DialogHeader>
            <AlbumForm onCreated={onCreated} />
          </DialogContent>
        </Dialog>
      </div>
      <p className="text-xs text-muted-foreground">Every upload belongs to an album. Share the album link to let others see it.</p>
    </div>
  );
}
