import type { DataMode, ExcludedPaper, Paper, ResearchRequest, ResearchResult, SearchMethodology } from "@/lib/types/paper";
import { isMockFallbackEnabled } from "@/lib/research/validation";
import { generateAcademicQueries } from "@/lib/scholarly/query";
import { searchPubMed } from "@/lib/scholarly/pubmed";
import { searchOpenAlex } from "@/lib/scholarly/openalex";
import { dedupePapers } from "@/lib/scholarly/dedupe";
import { filterPapers } from "@/lib/scholarly/filter";
import { rankPapers } from "@/lib/scoring/paperScore";
import { buildEvidenceTable, generateBriefMarkdown } from "@/lib/synthesis/briefGenerator";
import { generateDeckOutlineMarkdown } from "@/lib/synthesis/deckGenerator";
import { buildDeckPreviewSlides } from "@/lib/synthesis/deckPreview";
import { buildResearchSynthesis } from "@/lib/synthesis/researchSynthesis";
import { enhanceSynthesisWithExpertAgents } from "@/lib/synthesis/expertSynthesis";
import { mockPapers } from "@/lib/scholarly/mockPapers";

const MIN_TOPIC_RELEVANCE_SCORE = 35;
const UNREQUESTED_CONTEXT_DRIFT = [
  {
    label: "unrequested astrophysics/black-hole context",
    pattern: /\b(black holes?|event horizons?|general relativity|cosmolog(?:y|ical)|gravitational waves?)\b/i,
    allowedByQuery: /\b(black holes?|event horizons?|relativ(?:ity|istic)|cosmolog(?:y|ical)|gravitational|astrophysics?)\b/i
  }
] as const;

export function isBiomedicalQuery(question: string): boolean {
  return /\b(bio|biomedical|medical|clinical|patient|disease|therapy|therapeutic|cancer|immunotherapy|drug|vaccine|protein|genome|gene|crispr|cas9|cell|molecular|neuro|cardio|diabetes|pathway|enzyme|virus|viral|rna|dna)\b/i.test(
    question
  );
}

export function sourcesForQuestion(question: string): string[] {
  return isBiomedicalQuery(question) ? ["PubMed / NCBI E-utilities", "OpenAlex"] : ["OpenAlex"];
}

function methodologyFor(request: ResearchRequest, generatedQueries: string[], notes: string[]): SearchMethodology {
  return {
    generatedQueries,
    sources: sourcesForQuestion(request.question),
    dateRange: {
      startYear: request.startYear,
      endYear: request.endYear
    },
    includePreprints: request.includePreprints,
    maxPapers: request.maxPapers,
    analysisDepth: "abstract-only",
    notes
  };
}

async function retrievePapers(request: ResearchRequest): Promise<{
  papers: Paper[];
  warnings: string[];
}> {
  const warnings: string[] = [];
  const searchTasks: Array<{ source: "PubMed" | "OpenAlex"; run: Promise<Paper[]> }> = [
    { source: "OpenAlex", run: searchOpenAlex(request.question, request.startYear, request.endYear, request.maxPapers) }
  ];

  if (isBiomedicalQuery(request.question)) {
    searchTasks.unshift({
      source: "PubMed",
      run: searchPubMed(request.question, request.startYear, request.endYear, request.maxPapers)
    });
  }

  const results = await Promise.allSettled(searchTasks.map((task) => task.run));

  const papers = results.flatMap((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    const source = searchTasks[index].source;
    warnings.push(`${source} retrieval failed: ${result.reason instanceof Error ? result.reason.message : "unknown error"}`);
    return [];
  });

  return { papers, warnings };
}

function papersForFallback(request: ResearchRequest): Paper[] {
  return mockPapers.filter((paper) => {
    const year = paper.year || 0;
    return year >= request.startYear && year <= request.endYear;
  });
}

function hasEnoughTopicalOverlap(paper: Paper): boolean {
  return (paper.score?.relevanceScore || 0) >= MIN_TOPIC_RELEVANCE_SCORE;
}

function paperSearchText(paper: Paper): string {
  return `${paper.title} ${paper.abstract || ""} ${paper.journal || ""}`.toLowerCase();
}

export function unrequestedContextDriftReason(request: ResearchRequest, paper: Paper): string | undefined {
  return UNREQUESTED_CONTEXT_DRIFT.find(
    (rule) => !rule.allowedByQuery.test(request.question) && rule.pattern.test(paperSearchText(paper))
  )?.label;
}

function rankRelevantPapers(request: ResearchRequest, papers: Paper[]): {
  ranked: Paper[];
  relevanceExcluded: ExcludedPaper[];
} {
  const rankedCandidates = rankPapers(papers, request.question, request.startYear, request.endYear);
  const relevanceExcluded = rankedCandidates
    .filter((paper) => !hasEnoughTopicalOverlap(paper) || unrequestedContextDriftReason(request, paper))
    .map((paper) => ({
      paper,
      reason: unrequestedContextDriftReason(request, paper)
        ? `Excluded because it appears to be ${unrequestedContextDriftReason(request, paper)}.`
        : `Excluded because topical overlap was too weak (${paper.score?.relevanceScore || 0}/100 relevance).`
    }));

  return {
    ranked: rankedCandidates
      .filter((paper) => hasEnoughTopicalOverlap(paper) && !unrequestedContextDriftReason(request, paper))
      .slice(0, request.maxPapers),
    relevanceExcluded
  };
}

export async function runResearch(request: ResearchRequest): Promise<ResearchResult> {
  const generatedQueries = generateAcademicQueries(request.question).map((query) => query.query);
  const retrieval = await retrievePapers(request);
  const warnings = [...retrieval.warnings];

  let dataMode: DataMode = "live";
  let retrievedPapers = retrieval.papers;

  if (retrievedPapers.length === 0) {
    if (isMockFallbackEnabled()) {
      retrievedPapers = papersForFallback(request);
      dataMode = "mock-fallback";
      warnings.push("Live scholarly APIs returned no usable records. Demo fallback records are clearly labelled below.");
    } else {
      dataMode = "empty";
    }
  }

  const deduped = dedupePapers(retrievedPapers);
  const filtered = filterPapers(deduped, request.includePreprints);
  let { ranked, relevanceExcluded } = rankRelevantPapers(request, filtered.included);

  if (ranked.length === 0 && relevanceExcluded.length > 0) {
    dataMode = "empty";
    warnings.push(
      "Retrieved records were not synthesized because they had weak topical overlap with the search. Try a more specific topic or broaden the date range."
    );
  } else if (ranked.length === 0 && dataMode === "live" && isMockFallbackEnabled()) {
    const fallbackFiltered = filterPapers(papersForFallback(request), request.includePreprints);
    const fallbackRanked = rankRelevantPapers(request, fallbackFiltered.included);
    ranked = fallbackRanked.ranked;
    relevanceExcluded = [...relevanceExcluded, ...fallbackRanked.relevanceExcluded];

    if (ranked.length > 0) {
      dataMode = "mock-fallback";
      warnings.push("Retrieved records did not pass MVP filters. Demo fallback records are shown separately as mock evidence.");
    } else {
      dataMode = "empty";
    }
  } else if (ranked.length === 0) {
    dataMode = "empty";
  }

  const notes = [
    "Peer-review status is inferred from publication/source metadata.",
    "Key findings are abstract-derived and should be validated against full text before high-stakes use."
  ];
  const methodology = methodologyFor(request, generatedQueries, notes);
  const baseSynthesis = buildResearchSynthesis(request.question, methodology, ranked);
  const expertSynthesis = await enhanceSynthesisWithExpertAgents(request.question, methodology, ranked, baseSynthesis);
  const synthesis = expertSynthesis.synthesis;
  if (expertSynthesis.usedExpertModel) {
    warnings.push("Expert agent synthesis was used to create the topic primer, findings, and deck narrative.");
  } else if (expertSynthesis.warning) {
    warnings.push(expertSynthesis.warning);
  }
  const evidenceTable = buildEvidenceTable(ranked, synthesis.themes);
  const deckSlides = buildDeckPreviewSlides(request.question, methodology, ranked, evidenceTable, synthesis);
  const briefMarkdown =
    request.outputType === "brief" || request.outputType === "both"
      ? generateBriefMarkdown(request, methodology, ranked, evidenceTable, synthesis)
      : "";
  const deckOutlineMarkdown =
    request.outputType === "deck" || request.outputType === "both"
      ? generateDeckOutlineMarkdown(request, methodology, ranked, evidenceTable, synthesis)
      : "";

  return {
    question: request.question,
    dataMode,
    methodology,
    papers: ranked,
    excludedPapers: [...filtered.excluded, ...relevanceExcluded].slice(0, 20),
    synthesis,
    evidenceTable,
    briefMarkdown,
    deckOutlineMarkdown,
    deckSlides,
    usedMockData: dataMode === "mock-fallback",
    warnings
  };
}
