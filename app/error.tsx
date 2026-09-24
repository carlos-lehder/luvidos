"use client";

import { AlertTriangleIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/media/empty-state";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-20 sm:px-6">
      <EmptyState
        icon={AlertTriangleIcon}
        title="Something went wrong"
        description="We couldn't load this page. Please try again."
        action={
          <div className="flex gap-2">
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" render={<Link href="/" />}>
              Go home
            </Button>
          </div>
        }
      />
    </main>
  );
}
