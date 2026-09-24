import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  hasNext,
  hrefFor,
  total,
  pageSize,
}: {
  page: number;
  hasNext: boolean;
  hrefFor: (page: number) => string;
  total?: number;
  pageSize: number;
}) {
  if (page === 1 && !hasNext) return null;
  const totalPages = total ? Math.max(1, Math.ceil(total / pageSize)) : undefined;

  return (
    <nav className="flex items-center justify-between gap-4 pt-4" aria-label="Pagination">
      <Button
        variant="outline"
        disabled={page <= 1}
        render={page > 1 ? <Link href={hrefFor(page - 1)} /> : undefined}
      >
        <ChevronLeftIcon data-icon="inline-start" /> Previous
      </Button>
      <span className="text-sm text-muted-foreground tabular-nums">
        Page {page}
        {totalPages ? ` of ${totalPages}` : ""}
      </span>
      <Button
        variant="outline"
        disabled={!hasNext}
        render={hasNext ? <Link href={hrefFor(page + 1)} /> : undefined}
      >
        Next <ChevronRightIcon data-icon="inline-end" />
      </Button>
    </nav>
  );
}
