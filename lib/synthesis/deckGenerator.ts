import type { EvidenceClaim, Paper, ResearchRequest, SearchMethodology } from "@/lib/types/paper";

function compactPaper(paper?: Paper): string {
  if (!paper) {
    return "Evidence source to be selected";
  }

  return `${paper.title} (${paper.year || "n.d."}, ${paper.journal || "unknown source"})`;
}

export function generateDeckOutlineMarkdown(
  request: ResearchRequest,
  methodology: SearchMethodology,
  papers: Paper[],
  evidenceTable: EvidenceClaim[]
): string {
  const topPapers = papers.slice(0, 5);
  const claims = evidenceTable.slice(0, 3);

  return `# Slide Deck Outline: ${request.question}

## 1. Title Slide
- EzResearch evidence brief
- Research question: ${request.question}
- Date range: ${methodology.dateRange.startYear}-${methodology.dateRange.endYear}

## 2. Why This Topic Matters
- Frame the biomedical/life sciences importance of the question.
- Note that this deck is based on retrieved abstracts and metadata, not full-text extraction.

## 3. Scope and Methodology
- Sources: ${methodology.sources.join(", ")}
- Query strategy: ${methodology.generatedQueries.join("; ")}
- Inclusion rule: likely peer-reviewed journal literature${methodology.includePreprints ? ", with preprints allowed" : ", with likely preprints excluded"}

## 4. Literature Map
${topPapers.map((paper) => `- ${compactPaper(paper)} - score ${paper.score?.finalScore ?? "n/a"}/100`).join("\n")}

## 5. Key Finding 1
- ${claims[0]?.claim || "No claim generated"}
- Evidence: ${(claims[0]?.supportingPaperIds || []).map((id) => compactPaper(papers.find((paper) => paper.id === id))).join("; ")}

## 6. Key Finding 2
- ${claims[1]?.claim || "No second claim generated"}
- Evidence: ${(claims[1]?.supportingPaperIds || []).map((id) => compactPaper(papers.find((paper) => paper.id === id))).join("; ")}

## 7. Key Finding 3
- ${claims[2]?.claim || "No third claim generated"}
- Evidence: ${(claims[2]?.supportingPaperIds || []).map((id) => compactPaper(papers.find((paper) => paper.id === id))).join("; ")}

## 8. Evidence Strength
- High confidence claims require strong relevance, recent publication date, journal/review evidence type, and supporting papers.
- Current confidence remains limited by abstract-only analysis.

## 9. Open Questions
- Which findings persist after full-text review?
- Which methods, models, populations, or outcome measures explain disagreement?
- Are there major newer papers missing from PubMed/OpenAlex coverage?

## 10. References
${papers.slice(0, 10).map((paper) => `- ${compactPaper(paper)}${paper.doi ? `, DOI: ${paper.doi}` : ""}`).join("\n")}
`;
}
