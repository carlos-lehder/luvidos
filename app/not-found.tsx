import { CompassIcon } from "lucide-react";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { EmptyState } from "@/components/media/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-20 sm:px-6">
        <EmptyState
          icon={CompassIcon}
          title="Page not found"
          description="The page you're looking for doesn't exist or has moved."
          action={<Button render={<Link href="/" />}>Go home</Button>}
        />
      </main>
      <SiteFooter />
    </>
  );
}
