import { NextResponse } from "next/server";
import type { ResearchRequest } from "@/lib/types/paper";
import { runResearch } from "@/lib/research/runResearch";
import { parseResearchRequest } from "@/lib/research/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const parsed = parseResearchRequest((await request.json()) as Partial<ResearchRequest>);
    return NextResponse.json(await runResearch(parsed));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Research request failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
