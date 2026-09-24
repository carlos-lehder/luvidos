import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UploadError } from "@/lib/services/upload.service";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Maps known error types to safe JSON responses; never leaks stack traces. */
export function handleApiError(error: unknown) {
  if (error instanceof UploadError) return jsonError(error.message, error.status);
  if (error instanceof ZodError) {
    return jsonError(error.issues[0]?.message ?? "Invalid request.", 400);
  }
  console.error("[api]", error);
  return jsonError("Something went wrong. Please try again.", 500);
}
