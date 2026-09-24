import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Logo } from "@/components/layout/logo";
import { UserMenu } from "@/components/layout/user-menu";
import { AdBanner } from "@/components/layout/ad-banner";
import { userService } from "@/lib/services/user.service";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const [user, profile] = await Promise.all([getCurrentUser(), userService.getCurrentProfile()]);
  if (!user || !profile) redirect("/login?next=/dashboard");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-3 px-4 sm:px-6">
          <Logo />
          <span className="hidden text-sm text-muted-foreground sm:inline">/ Dashboard</span>
          <div className="ml-auto flex items-center gap-2">
            <UserMenu profile={profile} email={user.email ?? null} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-10">
        <aside className="lg:sticky lg:top-22 lg:h-fit lg:w-56 lg:shrink-0">
          <div className="-mx-4 border-b px-4 pb-3 sm:-mx-6 sm:px-6 lg:hidden">
            <DashboardNav orientation="horizontal" />
          </div>
          <div className="hidden lg:block">
            <DashboardNav />
          </div>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col gap-6">
          <AdBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
