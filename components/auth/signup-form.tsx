"use client";

import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { signupAction, type AuthState } from "@/app/actions/auth";
import { StatusAlert } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, {} as AuthState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <StatusAlert state={state} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-username">Username</Label>
        <Input
          id="signup-username"
          name="username"
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-z0-9_]{3,30}"
          placeholder="yourname"
          aria-describedby="signup-username-help"
        />
        <p id="signup-username-help" className="text-xs text-muted-foreground">
          3–30 lowercase letters, numbers or underscores.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-display">Display name (optional)</Label>
        <Input id="signup-display" name="displayName" autoComplete="name" maxLength={60} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-email">Email</Label>
        <Input id="signup-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-password">Password</Label>
        <Input id="signup-password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
        Create account
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
