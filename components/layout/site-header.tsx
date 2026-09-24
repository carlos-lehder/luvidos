import { UploadIcon } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { userService } from "@/lib/services/user.service";
import { getCurrentUser } from "@/lib/supabase/server";

export async function SiteHeader() {
  const [user, profile] = await Promise.all([getCurrentUser(), userService.getCurrentProfile()]);
  const isAuthenticated = !!user && !!profile;

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur supports-backdrop-filter:bg-background/50">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Logo />
        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Button size="sm" render={<Link href="/dashboard/upload" />}>
                <UploadIcon data-icon="inline-start" /> Upload
              </Button>
              <UserMenu profile={profile} email={user.email ?? null} />
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" render={<Link href="/login" />}>
                Sign in
              </Button>
              <Button size="sm" render={<Link href="/signup" />}>
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
