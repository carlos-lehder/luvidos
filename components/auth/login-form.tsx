"use client";

import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { loginAction, magicLinkAction, type AuthState } from "@/app/actions/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const initial: AuthState = {};

export function LoginForm({ next, authError }: { next?: string; authError?: boolean }) {
  const [pwState, pwAction, pwPending] = useActionState(loginAction, initial);
  const [mlState, mlAction, mlPending] = useActionState(magicLinkAction, initial);

  return (
    <Tabs defaultValue="password" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="magic">Magic link</TabsTrigger>
      </TabsList>

      <TabsContent value="password">
        <form action={pwAction} className="flex flex-col gap-4 pt-2">
          {next && <input type="hidden" name="next" value={next} />}
          <StatusAlert state={pwState} authError={authError} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-email">Email</Label>
            <Input id="login-email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-password">Password</Label>
            <Input id="login-password" name="password" type="password" autoComplete="current-password" required minLength={8} />
          </div>
          <Button type="submit" size="lg" disabled={pwPending}>
            {pwPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
            Sign in
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="magic">
        <form action={mlAction} className="flex flex-col gap-4 pt-2">
          {next && <input type="hidden" name="next" value={next} />}
          <StatusAlert state={mlState} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="magic-email">Email</Label>
            <Input id="magic-email" name="email" type="email" autoComplete="email" required />
          </div>
          <Button type="submit" size="lg" disabled={mlPending}>
            {mlPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
            Send magic link
          </Button>
        </form>
      </TabsContent>

      <p className="pt-4 text-center text-sm text-muted-foreground">
        New to Luvidos?{" "}
        <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </Tabs>
  );
}

export function StatusAlert({ state, authError }: { state: AuthState; authError?: boolean }) {
  if (state.error || authError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>{state.error ?? "The sign-in link is invalid or has expired."}</AlertDescription>
      </Alert>
    );
  }
  if (state.success) {
    return (
      <Alert>
        <AlertTitle>Check your email</AlertTitle>
        <AlertDescription>{state.success}</AlertDescription>
      </Alert>
    );
  }
  return null;
}
