import type { EvidenceClaim, Paper, ResearchRequest, ResearchSynthesis, ResearchTheme, SearchMethodology } from "@/lib/types/paper";

function cite(paper: Paper): string {
  const leadAuthor = paper.authors[0]?.split(" ").pop() || "Unknown";
  return `${leadAuthor} et al., ${paper.year || "n.d."}`;
}

function referenceLine(paper: Paper): string {
  const authors = paper.authors.length > 0 ? paper.authors.slice(0, 6).join(", ") : "Authors not available";
  const doi = paper.doi ? ` DOI: ${paper.doi}.` : " DOI not available.";
  const journal = paper.journal || "Source not available";

  return `- ${authors}. (${paper.year || "n.d."}). ${paper.title}. ${journal}.${doi} Source: ${paper.source}.`;
}

function confidenceForTheme(theme: ResearchTheme): EvidenceClaim["confidence"] {
  if (theme.evidenceLevel === "Strong") return "High";
  if (theme.evidenceLevel === "Moderate") return "Moderate";
  return "Low";
}

export function buildEvidenceTable(papers: Paper[], themes?: ResearchTheme[]): EvidenceClaim[] {
  const paperIds = new Set(papers.map((paper) => paper.id));

  if (themes && themes.length > 0) {
    const themeClaims = themes
      .slice(0, 4)
      .map((theme) => ({
        claim: theme.headline,
        supportingPaperIds: theme.supportingPaperIds.filter((id) => paperIds.has(id)),
        confidence: confidenceForTheme(theme),
        explanation: theme.summary,
        limitations: theme.limitations.join(" ")
      }))
      .filter((claim) => claim.supportingPaperIds.length > 0);

    if (themeClaims.length > 0) {
      return themeClaims;
    }
  }

  const top = papers.slice(0, 6);

  return top.slice(0, 3).map((paper) => ({
    claim: paper.keyFinding || paper.title,
    supportingPaperIds: [paper.id],
    confidence: paper.score && paper.score.finalScore >= 75 ? "High" : paper.score && paper.score.finalScore >= 55 ? "Moderate" : "Low",
    explanation: `Claim is extracted from the abstract/metadata of ${cite(paper)} and has not been validated against full text.`,
    limitations: "Confidence reflects metadata and abstract signals only; full-text methods and results may change interpretation."
  }));
}

export function generateBriefMarkdown(
  request: ResearchRequest,
  methodology: SearchMethodology,
  papers: Paper[],
  evidenceTable: EvidenceClaim[],
  synthesis?: ResearchSynthesis
): string {
  const paperLines = papers
    .slice(0, request.maxPapers)
    .map(
      (paper, index) =>
        `${index + 1}. **${paper.title}** (${paper.year || "n.d."}, ${paper.journal || "unknown source"}) - score ${
          paper.score?.finalScore ?? "n/a"
        }/100. ${paper.reasonIncluded || ""}`
    )
    .join("\n");

  const findingLines = evidenceTable
    .map((claim) => {
      const supports = claim.supportingPaperIds
        .map((id) => papers.find((paper) => paper.id === id))
        .filter((paper): paper is Paper => Boolean(paper))
        .map(cite)
        .join("; ");

      return `- **${claim.claim}** Supported by ${supports}. Confidence: ${claim.confidence}. ${claim.limitations}`;
    })
    .join("\n");

  const evidenceLines = evidenceTable
    .map(
      (claim) =>
        `| ${claim.claim.replace(/\|/g, "/")} | ${claim.supportingPaperIds
          .map((id) => papers.find((paper) => paper.id === id)?.title || id)
          .join("; ")
          .replace(/\|/g, "/")} | ${claim.confidence} | ${claim.explanation.replace(/\|/g, "/")} | ${claim.limitations.replace(
          /\|/g,
          "/"
        )} |`
    )
    .join("\n");
  const takeawayLines = (synthesis?.keyTakeaways || [])
    .map((takeaway) => `- ${takeaway}`)
    .join("\n");
  const themeLines = (synthesis?.themes || [])
    .map(
      (theme, index) =>
        `${index + 1}. **${theme.title}** (${theme.evidenceLevel}). ${theme.summary} Implications: ${theme.implications.join(" ")}`
    )
    .join("\n\n");
  const insightLines = (synthesis?.paperInsights || [])
    .slice(0, 10)
    .map((insight, index) => {
      const paper = papers.find((candidate) => candidate.id === insight.paperId);
      const source = paper ? cite(paper) : insight.paperId;
      return `${index + 1}. **${source}.** ${insight.presentableTakeaway} Main result: ${insight.mainResult} Limitation: ${insight.limitations}`;
    })
    .join("\n");
  const agreementLines = (synthesis?.areasOfAgreement || []).map((item) => `- ${item}`).join("\n");
  const uncertaintyLines = (synthesis?.uncertainties || []).map((item) => `- ${item}`).join("\n");
  const gapLines = (synthesis?.researchGaps || []).map((item) => `- ${item}`).join("\n");

  return `# EzResearch Recent Findings Report: ${request.question}

## Scope
- Topic: ${request.question}
- Search window: ${methodology.dateRange.startYear}-${methodology.dateRange.endYear}
- Analysis depth: ${methodology.analysisDepth}
- Evidence base: ${papers.length} ranked scholarly records

## Executive Summary
${synthesis?.executiveAnswer || "This brief compresses retrieved scholarly metadata and abstracts into an evidence-grounded starting point for research review. It prioritises likely scholarly journal literature, ranks papers with transparent signals, and keeps citations tied to retrieved records."}

${takeawayLines || ""}

## Search Methodology
- Sources searched: ${methodology.sources.join(", ")}
- Generated queries: ${methodology.generatedQueries.join("; ")}
- Date range: ${methodology.dateRange.startYear}-${methodology.dateRange.endYear}
- Preprints: ${methodology.includePreprints ? "included when retrieved" : "excluded when metadata suggests preprint/repository source"}
- Analysis depth: ${methodology.analysisDepth}. Full text, figures, supplementary data, and PDFs are outside the current MVP.
- Peer-review language: records are described as likely peer-reviewed only when source and publication metadata support that inference.

## What This Field Is About
${synthesis?.topicPrimer.overview || "The topic primer is generated from retrieved titles, abstracts, publication types, and metadata."}

${synthesis?.topicPrimer.whyItMatters || ""}

## Recent Findings in the Selected Window
${themeLines || "No cross-paper themes were generated."}

## Abstract-Derived Claims
${findingLines || "No evidence claims were generated."}

## Strongest Papers Analysed
${paperLines || "No papers were available after filtering."}

## Paper-Level Expert Notes
${insightLines || "No paper-level expert notes were generated."}

## Evidence Table
| Claim | Supporting papers | Confidence | Explanation | Limitations |
|---|---|---|---|---|
${evidenceLines || "| No claim | No supporting papers | Low | No papers passed filters | Try a broader query |"}

## Areas of Agreement
${agreementLines || "The strongest signals are papers with direct topical overlap, recent publication dates, stronger publication-type metadata, and available citation counts."}

## Areas of Uncertainty or Disagreement
${uncertaintyLines || "This MVP does not resolve conflicting results across full methods, populations, interventions, or outcome measures. Treat abstract-only claims as directional until a full-text review is completed."}

## Research Gaps and Next Validation Steps
${gapLines || "Full-text validation is required to identify methodological gaps, conflicting results, and missing evidence."}

## Limitations of the Analysis
- Abstract-only analysis can miss methods, caveats, negative results, and subgroup findings from full text.
- Peer-review status is inferred from metadata and should be verified for high-stakes use.
- Citation counts are available mainly through OpenAlex and may lag recent publications.
- Claims are not generated beyond retrieved paper metadata and abstracts.

## References
${papers.map(referenceLine).join("\n")}
`;
}
