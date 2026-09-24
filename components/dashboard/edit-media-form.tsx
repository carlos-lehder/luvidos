"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { deleteMediaAction, updateMediaAction, type ActionState } from "@/app/actions/media";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "@/lib/config/media";
import type { MediaItem } from "@/types/media";

export function EditMediaForm({ media }: { media: MediaItem }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateMediaAction, {} as ActionState);
  const [isDeleting, startDelete] = useTransition();

  useEffect(() => {
    if (state.success) toast.success(state.success);
  }, [state]);

  function onDelete() {
    startDelete(async () => {
      const result = await deleteMediaAction(media.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Media deleted");
        router.push(`/dashboard/albums/${media.albumId}`);
      }
    });
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={media.id} />
      <input type="hidden" name="albumId" value={media.albumId} />

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-title">Title</Label>
        <Input id="edit-title" name="title" defaultValue={media.title} required maxLength={MAX_TITLE_LENGTH} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          name="description"
          defaultValue={media.description ?? ""}
          rows={5}
          maxLength={MAX_DESCRIPTION_LENGTH}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Visibility and tags are managed on the album.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <AlertDialog>
          <AlertDialogTrigger render={<Button type="button" variant="destructive" />}>
            <Trash2Icon data-icon="inline-start" /> Delete
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this media?</AlertDialogTitle>
              <AlertDialogDescription>
                The file and its metadata will be permanently removed. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={onDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}
