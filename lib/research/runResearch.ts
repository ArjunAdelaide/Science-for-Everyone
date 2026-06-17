import type { DataMode, Paper, ResearchRequest, ResearchResult, SearchMethodology } from "@/lib/types/paper";
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
import { mockPapers } from "@/lib/scholarly/mockPapers";

function methodologyFor(request: ResearchRequest, generatedQueries: string[], notes: string[]): SearchMethodology {
  return {
    generatedQueries,
    sources: ["PubMed / NCBI E-utilities", "OpenAlex"],
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
  const results = await Promise.allSettled([
    searchPubMed(request.question, request.startYear, request.endYear, request.maxPapers),
    searchOpenAlex(request.question, request.startYear, request.endYear, request.maxPapers)
  ]);

  const papers = results.flatMap((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    const source = index === 0 ? "PubMed" : "OpenAlex";
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
  let ranked = rankPapers(filtered.included, request.question, request.startYear, request.endYear).slice(
    0,
    request.maxPapers
  );

  if (ranked.length === 0 && dataMode === "live" && isMockFallbackEnabled()) {
    const fallbackFiltered = filterPapers(papersForFallback(request), request.includePreprints);
    ranked = rankPapers(fallbackFiltered.included, request.question, request.startYear, request.endYear).slice(
      0,
      request.maxPapers
    );
    dataMode = "mock-fallback";
    warnings.push("Retrieved records did not pass MVP filters. Demo fallback records are shown separately as mock evidence.");
  } else if (ranked.length === 0) {
    dataMode = "empty";
  }

  const notes = [
    "Peer-review status is inferred from publication/source metadata.",
    "Key findings are abstract-derived and should be validated against full text before high-stakes use."
  ];
  const methodology = methodologyFor(request, generatedQueries, notes);
  const evidenceTable = buildEvidenceTable(ranked);
  const deckSlides = buildDeckPreviewSlides(request.question, methodology, ranked, evidenceTable);
  const briefMarkdown =
    request.outputType === "brief" || request.outputType === "both"
      ? generateBriefMarkdown(request, methodology, ranked, evidenceTable)
      : "";
  const deckOutlineMarkdown =
    request.outputType === "deck" || request.outputType === "both"
      ? generateDeckOutlineMarkdown(request, methodology, ranked, evidenceTable)
      : "";

  return {
    question: request.question,
    dataMode,
    methodology,
    papers: ranked,
    excludedPapers: filtered.excluded.slice(0, 20),
    evidenceTable,
    briefMarkdown,
    deckOutlineMarkdown,
    deckSlides,
    usedMockData: dataMode === "mock-fallback",
    warnings
  };
}
