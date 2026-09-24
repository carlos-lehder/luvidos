import type { Metadata } from "next";
import { ArrowRightIcon, LinkIcon, ShieldCheckIcon, UploadIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/layout/logo-mark";
import { Button } from "@/components/ui/button";
import { AdBanner } from "@/components/layout/ad-banner";
import { getCurrentUser } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Luvidos — Free Private Photo & Video Sharing",
    description: "Share photos and videos privately with Luvidos. Create link-only albums, stream instantly, and keep everything private by default. No public galleries, no discovery.",
    keywords: "photo sharing, video sharing, private media, link sharing, cloud storage, secure sharing, media streaming, photo albums",
  };
}

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
            The easiest way to share{" "}
            <span className="text-fuchsia-300">photos and videos privately</span>
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground text-balance">
            Upload your photos and videos to private albums, share with a single link, and stream instantly. 
            {" "}<strong>Everything stays private</strong> — nothing is public, nothing is listed, only people with the link can see it.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" render={<Link href={user ? "/dashboard/upload" : "/signup"} />}>
              <UploadIcon data-icon="inline-start" />
              {user ? "Upload" : "Start Sharing Free"}
            </Button>
            {!user && (
              <Button size="lg" variant="ghost" render={<Link href="/login" />}>
                Sign in <ArrowRightIcon data-icon="inline-end" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Ad Banner */}
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <AdBanner />
      </div>

      <section className="border-t border-white/5">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
          <Feature icon={LinkIcon} title="Link-Only Sharing" description="Share albums with a single link. No public galleries or search results — only people with the link can access your content." />
          <Feature icon={ZapIcon} title="Instant Video Streaming" description="Videos start immediately and seek smoothly, backed by cloud storage. Stream large videos without waiting for downloads." />
          <Feature icon={ShieldCheckIcon} title="Private by Default" description="All albums and media are private. Access control is enforced server-side. Revoke sharing anytime by making an album private." />
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
