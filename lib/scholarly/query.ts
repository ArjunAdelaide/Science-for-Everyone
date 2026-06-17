import type { GeneratedQuery } from "@/lib/types/paper";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "from",
  "find",
  "finding",
  "findings",
  "in",
  "into",
  "latest",
  "methods",
  "of",
  "on",
  "or",
  "peer",
  "peer-reviewed",
  "published",
  "research",
  "the",
  "to",
  "what",
  "with"
]);

export function extractKeywords(question: string): string[] {
  const cleaned = question
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !/^\d+$/.test(word) && !STOP_WORDS.has(word));

  return Array.from(new Set(cleaned)).slice(0, 14);
}

export function generateAcademicQueries(question: string): GeneratedQuery[] {
  const keywords = extractKeywords(question);
  const core = keywords.slice(0, 8).join(" ");

  return [
    {
      label: "Question keywords",
      query: core || question
    },
    {
      label: "Biomedical journal focus",
      query: `${core || question} journal article review systematic review`
    },
    {
      label: "Methods and evidence",
      query: `${core || question} method efficacy limitation evidence`
    }
  ];
}

export function buildPubMedQuery(question: string, startYear: number, endYear: number): string {
  const keywords = extractKeywords(question);
  const core = keywords.map((keyword) => `${keyword}[Title/Abstract]`).join(" AND ");
  const dateFilter = `("${startYear}"[Date - Publication] : "${endYear}"[Date - Publication])`;
  const journalFilter = `(journal article[Publication Type] OR review[Publication Type] OR systematic review[Publication Type] OR meta-analysis[Publication Type])`;

  return `${core || question} AND ${dateFilter} AND ${journalFilter}`;
}

export function buildOpenAlexSearch(question: string): string {
  return extractKeywords(question).slice(0, 10).join(" ") || question;
}
