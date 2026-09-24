import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { handleApiError, jsonError } from "@/lib/api";
import { uploadService } from "@/lib/services/upload.service";
import { getCurrentUser } from "@/lib/supabase/server";
import { completeUploadSchema } from "@/lib/validation/media";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("You must be signed in to upload.", 401);

    const body = completeUploadSchema.parse(await request.json());
    const result = await uploadService.complete(user.id, body);

    revalidatePath("/dashboard", "layout");
    revalidatePath(`/album/${result.albumId}`);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
