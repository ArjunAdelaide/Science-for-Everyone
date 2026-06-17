import type { OutputType, ResearchRequest } from "@/lib/types/paper";

const OUTPUT_TYPES: OutputType[] = ["brief", "deck", "both"];
const MIN_YEAR = 1900;
const MAX_PAPERS = 30;
const MIN_PAPERS = 3;

function parseNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function parseOutputType(value: unknown): OutputType {
  return OUTPUT_TYPES.includes(value as OutputType) ? (value as OutputType) : "both";
}

export function parseResearchRequest(body: Partial<ResearchRequest>): ResearchRequest {
  const currentYear = new Date().getFullYear();
  const latestAllowedYear = currentYear + 1;
  const rawQuery = typeof body.question === "string" ? body.question.trim() : "";

  if (rawQuery.length < 2) {
    throw new Error("Enter a research topic, keyword, or question.");
  }

  const rawStartYear = parseNumber(body.startYear, currentYear - 5);
  const rawEndYear = parseNumber(body.endYear, currentYear);
  const boundedStart = clamp(rawStartYear, MIN_YEAR, latestAllowedYear);
  const boundedEnd = clamp(rawEndYear, MIN_YEAR, latestAllowedYear);
  const startYear = Math.min(boundedStart, boundedEnd);
  const endYear = Math.max(boundedStart, boundedEnd);

  return {
    question: rawQuery,
    startYear,
    endYear,
    maxPapers: clamp(parseNumber(body.maxPapers, 10), MIN_PAPERS, MAX_PAPERS),
    includePreprints: Boolean(body.includePreprints),
    outputType: parseOutputType(body.outputType)
  };
}

export function isMockFallbackEnabled(): boolean {
  return process.env.EZRESEARCH_ENABLE_MOCK_FALLBACK !== "false";
}
