import { NextResponse, type NextRequest } from "next/server";
import { handleApiError, jsonError } from "@/lib/api";
import { uploadService } from "@/lib/services/upload.service";
import { getCurrentUser } from "@/lib/supabase/server";
import { authorizeUploadSchema } from "@/lib/validation/media";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("You must be signed in to upload.", 401);

    const body = authorizeUploadSchema.parse(await request.json());
    const result = await uploadService.authorize(user.id, body);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
