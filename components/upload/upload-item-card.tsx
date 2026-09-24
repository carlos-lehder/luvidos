"use client";

import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  FilmIcon,
  ImageIcon,
  Loader2Icon,
  RotateCcwIcon,
  Trash2Icon,
  XCircleIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import type { UploadItem, UploadStatus } from "@/components/upload/uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "@/lib/config/media";
import { formatBytes, formatDuration } from "@/lib/utils/format";

const STATUS_LABEL: Record<UploadStatus, string> = {
  queued: "Ready",
  preparing: "Preparing",
  uploading: "Uploading",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function UploadItemCard({
  item,
  onChange,
  onCancel,
  onRetry,
  onRemove,
}: {
  item: UploadItem;
  onChange: (update: Partial<UploadItem>) => void;
  onCancel: () => void;
  onRetry: () => void;
  onRemove: () => void;
}) {
  const busy = item.status === "preparing" || item.status === "uploading" || item.status === "processing";
  const editable = item.status === "queued" || item.status === "failed" || item.status === "cancelled";
  const duration = formatDuration(item.duration);

  return (
    <Card size="sm">
      <CardContent className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10">
          {item.previewUrl && item.type === "image" ? (
            // Local object URL preview; next/image is not applicable here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.previewUrl} alt="" className="size-full object-cover" />
          ) : item.previewUrl && item.type === "video" ? (
            <video src={item.previewUrl} muted playsInline preload="metadata" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              {item.type === "video" ? <FilmIcon className="size-8" /> : <ImageIcon className="size-8" />}
            </span>
          )}
          {duration && (
            <span className="absolute right-1.5 bottom-1.5 rounded bg-black/70 px-1 text-[10px] font-medium text-white tabular-nums">
              {duration}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{item.file.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatBytes(item.file.size)}
                {item.width && item.height ? ` · ${item.width} × ${item.height}` : ""}
              </span>
            </div>
            <StatusBadge status={item.status} />
          </div>

          {busy && (
            <Progress
              value={item.status === "uploading" ? item.progress : item.status === "processing" ? 100 : 0}
              aria-label="Upload progress"
            >
              <span className="text-xs text-muted-foreground tabular-nums">
                {item.status === "uploading" ? `${item.progress}%` : STATUS_LABEL[item.status]}
              </span>
            </Progress>
          )}

          {item.error && <p className="text-sm text-destructive">{item.error}</p>}

          {item.status === "completed" && item.mediaId ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" render={<Link href={`/media/${item.mediaId}`} />}>
                <ExternalLinkIcon data-icon="inline-start" /> View media
              </Button>
              <Button size="sm" variant="ghost" render={<Link href={`/dashboard/media/${item.mediaId}/edit`} />}>
                Edit details
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`title-${item.id}`}>Title</Label>
                <Input
                  id={`title-${item.id}`}
                  value={item.title}
                  maxLength={MAX_TITLE_LENGTH}
                  disabled={!editable}
                  onChange={(e) => onChange({ title: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`desc-${item.id}`}>Description (optional)</Label>
                <Textarea
                  id={`desc-${item.id}`}
                  value={item.description}
                  rows={2}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  disabled={!editable}
                  onChange={(e) => onChange({ description: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {busy && (
              <Button size="sm" variant="outline" onClick={onCancel}>
                <XIcon data-icon="inline-start" /> Cancel
              </Button>
            )}
            {(item.status === "failed" || item.status === "cancelled") && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RotateCcwIcon data-icon="inline-start" /> Retry
              </Button>
            )}
            {!busy && (
              <Button size="sm" variant="ghost" onClick={onRemove}>
                <Trash2Icon data-icon="inline-start" /> Remove
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: UploadStatus }) {
  if (status === "completed") {
    return (
      <Badge className="bg-emerald-600 text-white">
        <CheckCircle2Icon /> Completed
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge variant="destructive">
        <XCircleIcon /> Failed
      </Badge>
    );
  }
  if (status === "cancelled") return <Badge variant="outline">Cancelled</Badge>;
  if (status === "queued") return <Badge variant="secondary">Ready</Badge>;
  return (
    <Badge variant="secondary">
      <Loader2Icon className="animate-spin" /> {STATUS_LABEL[status]}
    </Badge>
  );
}
