import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { albumService } from "@/lib/services/album.service";

export async function POST(_request: Request, ctx: RouteContext<"/api/album/[id]/view">) {
  try {
    const { id } = await ctx.params;
    await albumService.recordView(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
