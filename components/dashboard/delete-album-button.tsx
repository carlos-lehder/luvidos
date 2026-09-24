"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteAlbumAction } from "@/app/actions/album";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DeleteAlbumButton({
  albumId,
  title,
  mediaCount,
  redirectTo = "/dashboard/albums",
}: {
  albumId: string;
  title: string;
  mediaCount: number;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onDelete() {
    start(async () => {
      const result = await deleteAlbumAction(albumId);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Album deleted");
        router.push(redirectTo);
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button type="button" variant="destructive" />}>
        <Trash2Icon data-icon="inline-start" /> Delete album
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            {mediaCount > 0
              ? `This permanently removes the album and all ${mediaCount} item${mediaCount === 1 ? "" : "s"} inside it. This cannot be undone.`
              : "This permanently removes the album. This cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onDelete} disabled={pending}>
            {pending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
