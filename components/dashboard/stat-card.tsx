import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="truncate font-heading text-2xl font-semibold tabular-nums">{value}</span>
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card size="sm">
      <CardContent className="flex items-start gap-3">
        <Skeleton className="size-9 rounded-lg" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
