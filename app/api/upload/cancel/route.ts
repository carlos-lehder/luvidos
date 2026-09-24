import { NextResponse, type NextRequest } from "next/server";
import { handleApiError, jsonError } from "@/lib/api";
import { uploadService } from "@/lib/services/upload.service";
import { getCurrentUser } from "@/lib/supabase/server";
import { cancelUploadSchema } from "@/lib/validation/media";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Unauthorized.", 401);

    const body = cancelUploadSchema.parse(await request.json());
    const cancelled = await uploadService.cancel(user.id, body.uploadSessionId);
    return NextResponse.json({ cancelled });
  } catch (error) {
    return handleApiError(error);
  }
}
