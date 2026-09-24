import { NextResponse, type NextRequest } from "next/server";
import { handleApiError } from "@/lib/api";
import { mediaService } from "@/lib/services/media.service";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/media/[id]/view">) {
  try {
    const { id } = await ctx.params;
    const referer = request.headers.get("referer");
    await mediaService.recordView(id, {
      referer: referer ? new URL(referer).hostname : null,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
