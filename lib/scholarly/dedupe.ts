import type { Paper } from "@/lib/types/paper";

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function doiKey(doi?: string): string | undefined {
  return doi?.toLowerCase().replace(/^doi:/, "").trim();
}

function mergePapers(primary: Paper, secondary: Paper): Paper {
  return {
    ...primary,
    authors: primary.authors.length >= secondary.authors.length ? primary.authors : secondary.authors,
    journal: primary.journal || secondary.journal,
    year: primary.year || secondary.year,
    publicationDate: primary.publicationDate || secondary.publicationDate,
    doi: primary.doi || secondary.doi,
    url: primary.url || secondary.url,
    abstract: primary.abstract || secondary.abstract,
    publicationTypes: Array.from(new Set([...primary.publicationTypes, ...secondary.publicationTypes])),
    citationCount: Math.max(primary.citationCount || 0, secondary.citationCount || 0) || undefined,
    likelyPeerReviewed: primary.likelyPeerReviewed || secondary.likelyPeerReviewed,
    isPreprint: primary.isPreprint || secondary.isPreprint
  };
}

export function dedupePapers(papers: Paper[]): Paper[] {
  const byKey = new Map<string, Paper>();

  for (const paper of papers) {
    const key = doiKey(paper.doi) || normalizeTitle(paper.title);
    const existing = byKey.get(key);
    byKey.set(key, existing ? mergePapers(existing, paper) : paper);
  }

  return Array.from(byKey.values());
}
