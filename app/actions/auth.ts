"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/utils/site";
import { loginSchema, magicLinkSchema, signupSchema } from "@/lib/validation/auth";

export interface AuthState {
  error?: string;
  success?: string;
}

function safeNext(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Incorrect email or password." };

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    username: formData.get("username"),
    displayName: formData.get("displayName") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: absoluteUrl("/auth/callback"),
      data: {
        username: parsed.data.username,
        display_name: parsed.data.displayName ?? parsed.data.username,
      },
    },
  });
  if (error) {
    return { error: error.message.includes("registered") ? "An account with this email already exists." : "Could not create your account. Please try again." };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }
  return { success: "Check your inbox to confirm your email address, then sign in." };
}

export async function magicLinkAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = magicLinkSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: absoluteUrl(`/auth/callback?next=${safeNext(formData.get("next"))}`) },
  });
  if (error) return { error: "Could not send the sign-in link. Please try again." };
  return { success: "We sent you a magic link. Check your inbox." };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
