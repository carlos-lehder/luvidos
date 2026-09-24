import { ArrowRightIcon, LinkIcon, ShieldCheckIcon, UploadIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/layout/logo-mark";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/config/media";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col">
      <section className="relative flex flex-1 items-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-primary)_0%,transparent_55%)] opacity-20"
          aria-hidden="true"
        />
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-24 text-center sm:px-6 md:py-32">
          <LogoMark className="size-16" id="hero-mark" />
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
            Upload. Share one link.{" "}
            <span className="text-fuchsia-300">That&apos;s it.</span>
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground text-balance">
            {SITE_NAME} turns your photos and videos into private albums you can share with a single link.
            Nothing is public. Nothing is listed. Only the people you send the link to can see it.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" render={<Link href={user ? "/dashboard/upload" : "/signup"} />}>
              <UploadIcon data-icon="inline-start" />
              {user ? "Upload" : "Start for free"}
            </Button>
            {!user && (
              <Button size="lg" variant="ghost" render={<Link href="/login" />}>
                Sign in <ArrowRightIcon data-icon="inline-end" />
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
          <Feature icon={LinkIcon} title="Link-only" description="Albums never appear in any gallery or search. The link is the key." />
          <Feature icon={ZapIcon} title="Instant streaming" description="Videos start immediately and seek smoothly, straight from the cloud." />
          <Feature icon={ShieldCheckIcon} title="Private by default" description="Access is enforced on the server. Revoke by making an album private." />
        </div>
      </section>
    </div>
  );
}

function Feature({ icon: Icon, title, description }: { icon: typeof LinkIcon; title: string; description: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-fuchsia-300">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <h3 className="font-heading font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
