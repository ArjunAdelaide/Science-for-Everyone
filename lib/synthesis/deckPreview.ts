import type { DeckPreviewSlide, EvidenceClaim, Paper, SearchMethodology } from "@/lib/types/paper";

function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3).trim()}...`;
}

function cite(paper?: Paper): string {
  if (!paper) {
    return "Source unavailable";
  }

  const leadAuthor = paper.authors[0]?.split(" ").pop() || "Unknown";
  return `${leadAuthor} et al., ${paper.year || "n.d."}`;
}

function paperLabel(paper: Paper): string {
  return `${truncate(paper.title, 92)} (${paper.year || "n.d."}, ${paper.journal || paper.source})`;
}

function claimPapers(claim: EvidenceClaim | undefined, papers: Paper[]): Paper[] {
  return (claim?.supportingPaperIds || [])
    .map((id) => papers.find((paper) => paper.id === id))
    .filter((paper): paper is Paper => Boolean(paper));
}

export function buildDeckPreviewSlides(
  question: string,
  methodology: SearchMethodology,
  papers: Paper[],
  evidenceTable: EvidenceClaim[]
): DeckPreviewSlide[] {
  const topPapers = papers.slice(0, 6);
  const claims = evidenceTable.slice(0, 3);
  const topClaim = claims[0]?.claim;
  const findingSlides = claims.map((claim, index) => {
    const supportingPapers = claimPapers(claim, papers);

    return {
      id: `finding-${index + 1}`,
      eyebrow: `Finding ${index + 1}`,
      title: truncate(`Abstract-level evidence suggests: ${claim.claim}`, 125),
      subtitle: `Evidence confidence: ${claim.confidence}`,
      bullets: [
        `Evidence: ${supportingPapers.map(cite).join("; ") || "No supporting papers mapped"}.`,
        `Interpretation: this should be treated as a directional signal from retrieved abstracts, not a full-text conclusion.`,
        `Caveat: ${claim.limitations}`
      ],
      citations: supportingPapers.map(paperLabel),
      footnote: "Claim is generated only from retrieved abstract and metadata fields."
    };
  });

  return [
    {
      id: "title",
      eyebrow: "EzResearch evidence deck",
      title: truncate(question, 125),
      subtitle: `${methodology.dateRange.startYear}-${methodology.dateRange.endYear} | ${papers.length} papers analysed`,
      bullets: [
        "Evidence-grounded research intelligence package.",
        "Built from retrieved PubMed/OpenAlex records with citation traceability.",
        "Designed as an executive-ready starting point for deeper review."
      ],
      citations: []
    },
    {
      id: "executive-takeaway",
      eyebrow: "Executive takeaway",
      title: topClaim
        ? truncate(`The strongest retrieved signal is: ${topClaim}`, 125)
        : "The search produced an auditable evidence base, but no strong claim passed synthesis.",
      subtitle: "Answer-first summary",
      bullets: [
        `${papers.length} likely scholarly records were analysed after deduplication and filtering.`,
        `The current evidence package is ${methodology.analysisDepth}; full-text validation remains required.`,
        "The deck highlights what the retrieved abstracts support, where confidence is limited, and which papers carry each claim."
      ],
      citations: topPapers.slice(0, 3).map(paperLabel),
      footnote: "Takeaway is constrained to retrieved metadata and abstracts."
    },
    {
      id: "methodology",
      eyebrow: "Methodology",
      title: "The search pipeline prioritised traceable scholarly evidence over opaque summarisation",
      subtitle: methodology.sources.join(" + "),
      bullets: [
        `Generated queries: ${methodology.generatedQueries.join("; ")}`,
        methodology.includePreprints
          ? "Preprints were allowed when retrieved."
          : "Likely preprints/repository records were excluded when metadata supported that inference.",
        "Likely peer-reviewed status is inferred from publication/source metadata, not asserted with certainty.",
        "Ranking uses relevance, recency, publication type, citation count, and source-quality signals."
      ],
      citations: []
    },
    {
      id: "evidence-base",
      eyebrow: "Evidence base",
      title: "The highest-ranked records combine topical fit, recency, evidence type, and citation signal",
      subtitle: "Transparent scoring model",
      bullets: topPapers.map(
        (paper) =>
          `${paper.score?.finalScore ?? "n/a"}/100 - ${truncate(paper.title, 86)} (${paper.year || "n.d."})`
      ),
      citations: topPapers.map(paperLabel)
    },
    ...findingSlides,
    {
      id: "evidence-strength",
      eyebrow: "Evidence strength",
      title: "Confidence should be interpreted as evidence triage, not final scientific adjudication",
      subtitle: "Useful, but not a substitute for full-text review",
      bullets: [
        "High-confidence claims need strong query overlap, recent publication date, stronger publication type, and multiple supporting papers.",
        "Systematic reviews, meta-analyses, reviews, clinical trials, and journal articles receive different evidence weights.",
        "Citation counts are used where available, primarily through OpenAlex.",
        "Full-text review is needed for methods, populations, outcomes, safety caveats, and disagreement."
      ],
      citations: topPapers.slice(0, 3).map(paperLabel)
    },
    {
      id: "risks-and-next-steps",
      eyebrow: "Risks and next steps",
      title: "A full research pass should validate methods, outcomes, and disagreement before decisions",
      bullets: [
        "Which findings persist after full-text review?",
        "Which methods, models, populations, or outcomes explain disagreement?",
        "Are newer papers missing from PubMed/OpenAlex coverage or metadata delays?",
        "Which claims require deeper validation before use in a decision or publication?"
      ],
      citations: []
    },
    {
      id: "references",
      eyebrow: "References",
      title: "Retrieved paper metadata used in this deck",
      bullets: papers.slice(0, 8).map((paper, index) => `${index + 1}. ${paperLabel(paper)}${paper.doi ? ` DOI: ${paper.doi}` : ""}`),
      citations: papers.slice(0, 8).map(paperLabel),
      footnote: "References are generated only from retrieved metadata."
    }
  ];
}
