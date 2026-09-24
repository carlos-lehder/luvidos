"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { createAlbumAction, updateAlbumAction, type AlbumActionState } from "@/app/actions/album";
import { VisibilitySelect } from "@/components/upload/visibility-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "@/lib/config/media";
import type { AlbumItem, MediaVisibility } from "@/types/media";

export function AlbumForm({
  album,
  redirectTo,
  onCreated,
  submitLabel,
}: {
  album?: AlbumItem;
  /** "upload" redirects to the upload page for the new album after creation. */
  redirectTo?: "upload";
  onCreated?: (albumId: string) => void;
  submitLabel?: string;
}) {
  const router = useRouter();
  const action = album ? updateAlbumAction : createAlbumAction;
  const [state, formAction, pending] = useActionState(action, {} as AlbumActionState);
  const [visibility, setVisibility] = useState<MediaVisibility>(
    album?.visibility && album.visibility !== "public" ? album.visibility : "unlisted",
  );

  useEffect(() => {
    if (!state.success) return;
    toast.success(state.success);
    if (!album && state.albumId) {
      if (onCreated) onCreated(state.albumId);
      else router.push(`/dashboard/albums/${state.albumId}`);
    }
  }, [state, album, onCreated, router]);

  const idPrefix = album ? `album-${album.id}` : "album-new";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {album && <input type="hidden" name="id" value={album.id} />}
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      <input type="hidden" name="visibility" value={visibility} />

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-title`}>Album title</Label>
        <Input
          id={`${idPrefix}-title`}
          name="title"
          defaultValue={album?.title ?? ""}
          placeholder="Summer trip 2026"
          required
          maxLength={MAX_TITLE_LENGTH}
          autoFocus={!album}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          name="description"
          defaultValue={album?.description ?? ""}
          rows={4}
          maxLength={MAX_DESCRIPTION_LENGTH}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-tags`}>Tags</Label>
          <Input
            id={`${idPrefix}-tags`}
            name="tags"
            defaultValue={album?.tags.join(", ") ?? ""}
            placeholder="travel, nature, 4k"
            aria-describedby={`${idPrefix}-tags-help`}
          />
          <p id={`${idPrefix}-tags-help`} className="text-xs text-muted-foreground">
            Comma separated, up to 10.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-visibility`}>Visibility</Label>
          <VisibilitySelect id={`${idPrefix}-visibility`} value={visibility} onChange={setVisibility} />
          <p className="text-xs text-muted-foreground">Albums are never listed publicly — only people with the link can open them.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
          {submitLabel ?? (album ? "Save changes" : "Create album")}
        </Button>
      </div>
    </form>
  );
}
