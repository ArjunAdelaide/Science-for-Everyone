import type { Paper, ScoreBreakdown } from "@/lib/types/paper";
import { extractKeywords } from "@/lib/scholarly/query";

export const PAPER_SCORE_WEIGHTS = {
  relevance: 0.5,
  recency: 0.18,
  evidenceType: 0.24,
  citations: 0.08
} as const;

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function textForPaper(paper: Paper): string {
  return `${paper.title} ${paper.abstract || ""} ${paper.journal || ""} ${paper.publicationTypes.join(" ")}`.toLowerCase();
}

function scoreRelevance(question: string, paper: Paper): number {
  const keywords = extractKeywords(question);
  if (keywords.length === 0) {
    return 50;
  }

  const text = textForPaper(paper);
  const matched = keywords.filter((keyword) => text.includes(keyword.toLowerCase()));
  const titleMatched = keywords.filter((keyword) => paper.title.toLowerCase().includes(keyword.toLowerCase()));

  return clamp((matched.length / keywords.length) * 70 + (titleMatched.length / keywords.length) * 30);
}

function scoreRecency(year: number | undefined, startYear: number, endYear: number): number {
  if (!year) {
    return 35;
  }

  if (endYear <= startYear) {
    return year >= endYear ? 100 : 50;
  }

  return clamp(((year - startYear) / (endYear - startYear)) * 100);
}

function scoreEvidence(paper: Paper): number {
  const types = paper.publicationTypes.join(" ").toLowerCase();

  if (/systematic review|meta-analysis|meta analysis/.test(types)) {
    return 96;
  }

  if (/review/.test(types)) {
    return 82;
  }

  if (/clinical trial|randomized|controlled trial/.test(types)) {
    return 86;
  }

  if (/journal article|article|journal-article/.test(types)) {
    return 72;
  }

  return paper.likelyPeerReviewed ? 58 : 35;
}

function scoreCitations(citationCount?: number): number {
  if (!citationCount) {
    return 20;
  }

  return clamp(Math.log10(citationCount + 1) * 38);
}

function explainScore(paper: Paper, score: Omit<ScoreBreakdown, "explanation">): string[] {
  const explanations = [
    `Relevance: ${score.relevanceScore}/100 from keyword overlap across title, abstract, source, and publication type.`,
    `Recency: ${score.recencyScore}/100 based on publication year within the selected date range.`,
    `Evidence type: ${score.evidenceScore}/100 from ${paper.publicationTypes.join(", ") || "available metadata"}.`
  ];

  if (paper.citationCount !== undefined) {
    explanations.push(`Citation signal: ${score.citationScore}/100 from ${paper.citationCount} OpenAlex citations.`);
  } else {
    explanations.push("Citation signal: scored conservatively because citation count was unavailable.");
  }

  if (score.relevancePenalty < 1) {
    explanations.push("Final score was discounted because topical overlap was weak.");
  }

  return explanations;
}

export function scorePaper(
  paper: Paper,
  question: string,
  startYear: number,
  endYear: number
): ScoreBreakdown {
  const relevanceScore = scoreRelevance(question, paper);
  const recencyScore = scoreRecency(paper.year, startYear, endYear);
  const evidenceScore = scoreEvidence(paper);
  const citationScore = scoreCitations(paper.citationCount);
  const baseScore =
    relevanceScore * PAPER_SCORE_WEIGHTS.relevance +
    recencyScore * PAPER_SCORE_WEIGHTS.recency +
    evidenceScore * PAPER_SCORE_WEIGHTS.evidenceType +
    citationScore * PAPER_SCORE_WEIGHTS.citations;
  const relevancePenalty = relevanceScore < 25 ? 0.55 : relevanceScore < 40 ? 0.8 : 1;
  const finalScore = clamp(baseScore * relevancePenalty);

  return {
    relevanceScore,
    recencyScore,
    evidenceScore,
    citationScore,
    finalScore,
    relevancePenalty,
    explanation: explainScore(paper, {
      relevanceScore,
      recencyScore,
      evidenceScore,
      citationScore,
      finalScore,
      relevancePenalty
    })
  };
}

export function rankPapers(papers: Paper[], question: string, startYear: number, endYear: number): Paper[] {
  return papers
    .map((paper) => {
      const score = scorePaper(paper, question, startYear, endYear);
      return {
        ...paper,
        score,
        relevanceToQuestion: score.explanation[0],
        keyFinding: inferKeyFinding(paper),
        method: inferMethod(paper),
        limitation: "Abstract and metadata only; full text was not analysed."
      };
    })
    .sort((a, b) => (b.score?.finalScore || 0) - (a.score?.finalScore || 0));
}

function firstSentence(text?: string): string | undefined {
  return text?.split(/(?<=[.!?])\s+/)[0]?.trim();
}

function inferKeyFinding(paper: Paper): string {
  return firstSentence(paper.abstract) || `${paper.title} is relevant to the research question based on metadata.`;
}

function inferMethod(paper: Paper): string {
  const types = paper.publicationTypes.join(", ");
  return types ? `Publication type metadata: ${types}.` : "Method not available from metadata.";
}
