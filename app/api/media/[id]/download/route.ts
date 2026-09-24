import { NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api";
import { mediaService } from "@/lib/services/media.service";

export async function GET(_request: Request, ctx: RouteContext<"/api/media/[id]/download">) {
  try {
    const { id } = await ctx.params;
    const url = await mediaService.createDownloadUrl(id);
    if (!url) return jsonError("Media not found.", 404);
    return NextResponse.redirect(url, { status: 302 });
  } catch (error) {
    return handleApiError(error);
  }
}
