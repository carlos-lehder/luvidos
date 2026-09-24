import type { Metadata } from "next";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { userService } from "@/lib/services/user.service";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage() {
  const [user, profile] = await Promise.all([getCurrentUser(), userService.getCurrentProfile()]);
  if (!user || !profile) return null;

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and account.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your name is shown to people who open your shared albums.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={profile} />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Signed in with Supabase Auth.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 text-sm">
              <div className="flex flex-col">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="truncate font-medium">{user.email}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-muted-foreground">User ID</dt>
                <dd className="truncate font-mono text-xs">{user.id}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
