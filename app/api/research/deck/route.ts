import { NextResponse } from "next/server";
import type { ResearchRequest, ResearchResult } from "@/lib/types/paper";
import { runResearch } from "@/lib/research/runResearch";
import { parseResearchRequest } from "@/lib/research/validation";
import { storeDeckDownload } from "@/lib/synthesis/deckDownloadStore";
import { generateResearchDeckBuffer } from "@/lib/synthesis/pptxGenerator";

export const runtime = "nodejs";

type DeckRequestBody = Partial<ResearchRequest> & {
  request?: Partial<ResearchRequest>;
  result?: ResearchResult;
};

function isResearchResult(value: unknown): value is ResearchResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ResearchResult>;
  return (
    typeof candidate.question === "string" &&
    Array.isArray(candidate.papers) &&
    Array.isArray(candidate.evidenceTable) &&
    Boolean(candidate.methodology)
  );
}

function fileNameFor(question: string): string {
  const slug =
    question
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 54) || "research-deck";

  return `ezresearch-${slug}.pptx`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DeckRequestBody;
    const result = isResearchResult(body.result)
      ? body.result
      : await runResearch(parseResearchRequest(body.request || body));
    const buffer = await generateResearchDeckBuffer(result);
    const fileName = fileNameFor(result.question);

    if (new URL(request.url).searchParams.get("delivery") === "link") {
      const id = storeDeckDownload(buffer, fileName);

      return NextResponse.json(
        {
          byteLength: buffer.byteLength,
          downloadUrl: `/api/research/deck/download?id=${encodeURIComponent(id)}`,
          fileName
        },
        {
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(buffer.byteLength)
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deck generation failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
