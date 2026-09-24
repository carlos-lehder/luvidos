"use client";

import { Loader2Icon } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateProfileAction, type ActionState } from "@/app/actions/media";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileRow } from "@/types/database";

export function ProfileForm({ profile }: { profile: ProfileRow }) {
  const [state, action, pending] = useActionState(updateProfileAction, {} as ActionState);

  useEffect(() => {
    if (state.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-username">Username</Label>
        <Input
          id="profile-username"
          name="username"
          defaultValue={profile.username}
          required
          minLength={3}
          maxLength={30}
          pattern="[a-z0-9_]{3,30}"
          aria-describedby="profile-username-help"
        />
        <p id="profile-username-help" className="text-xs text-muted-foreground">
          Shown on your shared albums when no display name is set.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-display">Display name</Label>
        <Input id="profile-display" name="displayName" defaultValue={profile.display_name ?? ""} maxLength={60} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-bio">Bio</Label>
        <Textarea id="profile-bio" name="bio" defaultValue={profile.bio ?? ""} rows={4} maxLength={300} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
          Save profile
        </Button>
      </div>
    </form>
  );
}
