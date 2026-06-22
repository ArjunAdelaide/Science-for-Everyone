import { NextResponse } from "next/server";
import { getDeckDownload } from "@/lib/synthesis/deckDownloadStore";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing deck download id." }, { status: 400 });
  }

  const deck = getDeckDownload(id);
  if (!deck) {
    return NextResponse.json({ error: "Deck download expired. Generate the PPTX again." }, { status: 404 });
  }

  return new Response(deck.buffer, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${deck.fileName}"`,
      "Content-Length": String(deck.buffer.byteLength),
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    }
  });
}
