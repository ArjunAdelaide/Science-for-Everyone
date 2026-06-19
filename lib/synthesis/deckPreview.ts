import type { DeckPreviewSlide, EvidenceClaim, Paper, ResearchSynthesis, ResearchTheme, SearchMethodology } from "@/lib/types/paper";

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

function sourceMix(papers: Paper[]): string {
  const counts = papers.reduce<Record<string, number>>((acc, paper) => {
    const source = paper.source === "pubmed" ? "PubMed" : paper.source === "openalex" ? "OpenAlex" : "Demo";
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([source, count]) => `${source}: ${count}`)
    .join(" | ");
}

function evidenceMix(papers: Paper[]): string {
  const labels = papers.flatMap((paper) => paper.publicationTypes).filter(Boolean);
  const priority = ["Meta-Analysis", "Systematic Review", "Review", "Clinical Trial", "Journal Article"];
  const present = priority.filter((label) => labels.some((type) => type.toLowerCase().includes(label.toLowerCase())));
  return present.length ? present.slice(0, 4).join(", ") : "journal/source metadata varies by record";
}

function claimPapers(claim: EvidenceClaim | undefined, papers: Paper[]): Paper[] {
  return (claim?.supportingPaperIds || [])
    .map((id) => papers.find((paper) => paper.id === id))
    .filter((paper): paper is Paper => Boolean(paper));
}

function themePapers(theme: ResearchTheme, papers: Paper[]): Paper[] {
  return theme.supportingPaperIds
    .map((id) => papers.find((paper) => paper.id === id))
    .filter((paper): paper is Paper => Boolean(paper));
}

export function buildDeckPreviewSlides(
  question: string,
  methodology: SearchMethodology,
  papers: Paper[],
  evidenceTable: EvidenceClaim[],
  synthesis?: ResearchSynthesis
): DeckPreviewSlide[] {
  const topPapers = papers.slice(0, 6);
  const claims = evidenceTable.slice(0, 3);
  const themes = synthesis?.themes || [];
  const topClaim = synthesis?.keyTakeaways[1] || claims[0]?.claim;
  const findingSlides = (themes.length > 0 ? themes.slice(0, 4) : []).map((theme, index) => {
    const supportingPapers = themePapers(theme, papers);

    return {
      id: `finding-${index + 1}`,
      eyebrow: `Theme ${index + 1}`,
      title: truncate(theme.headline, 125),
      subtitle: `${theme.evidenceLevel} evidence signal based on ${supportingPapers.length} mapped source${supportingPapers.length === 1 ? "" : "s"}`,
      bullets: [
        `What the evidence says: ${theme.summary}`,
        `Why it matters: ${theme.implications.join(" ")}`,
        `Methods/signals: ${theme.methods.join(", ") || "metadata varies across records"}.`,
        `Support: ${supportingPapers.map(cite).join("; ") || "no supporting papers mapped by the synthesis step"}.`,
        `Presenter note: state this as a cross-paper abstract-level theme, not a settled full-text conclusion.`,
        `Limitation: ${theme.limitations.join(" ")}`
      ],
      citations: supportingPapers.map(paperLabel),
      footnote: "Claim is generated only from retrieved abstract and metadata fields."
    };
  });
  const fallbackFindingSlides = findingSlides.length
    ? findingSlides
    : claims.map((claim, index) => {
        const supportingPapers = claimPapers(claim, papers);

        return {
          id: `finding-${index + 1}`,
          eyebrow: `Finding ${index + 1}`,
          title: truncate(claim.claim, 125),
          subtitle: `${claim.confidence} confidence based on ${supportingPapers.length} mapped source${supportingPapers.length === 1 ? "" : "s"}`,
          bullets: [
            `What the evidence says: ${claim.explanation}`,
            `Support: ${supportingPapers.map(cite).join("; ") || "no supporting papers mapped by the synthesis step"}.`,
            `Presenter note: state this as an abstract-level signal, not a settled full-text conclusion.`,
            `Limitation: ${claim.limitations}`
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
        "Presentation-ready research brief built from retrieved scholarly metadata and abstracts.",
        "The deck uses a controlled role-based synthesis pipeline: retrieval, evidence mapping, theme collation, and presentation strategy.",
        "Every substantive claim is tied back to source records in the deck and sources column."
      ],
      citations: []
    },
    {
      id: "executive-takeaway",
      eyebrow: "Executive takeaway",
      title: topClaim
        ? truncate(`The strongest retrieved signal: ${topClaim}`, 125)
        : "The search produced an auditable evidence base, but no strong claim passed synthesis.",
      subtitle: "Use this slide to open the presentation",
      bullets: [
        synthesis?.executiveAnswer || `${papers.length} likely scholarly records were analysed after deduplication, preprint filtering, and transparent scoring.`,
        `Source mix: ${sourceMix(papers) || "no sources retrieved"}.`,
        `Evidence mix: ${evidenceMix(papers)}.`,
        "The deck separates supported claims, confidence, limitations, and references so it can be presented without inventing citations."
      ],
      citations: topPapers.slice(0, 3).map(paperLabel),
      footnote: "Takeaway is constrained to retrieved metadata and abstracts."
    },
    {
      id: "presentation-roadmap",
      eyebrow: "Roadmap",
      title: "The deck moves from answer to evidence themes to caveats",
      subtitle: "A presenter-ready structure for any searched topic",
      bullets: [
        "Start with the executive answer and the evidence landscape.",
        "Walk through the strongest cross-paper themes, each with source support.",
        "Explain what each theme means, where confidence is limited, and what to validate next.",
        "Use the sources column to answer where each claim came from."
      ],
      citations: []
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
      eyebrow: "Source landscape",
      title: "The evidence base is ranked for relevance, recency, evidence type, and citation signal",
      subtitle: `${sourceMix(papers)} | ${evidenceMix(papers)}`,
      bullets: topPapers.map(
        (paper) =>
          `${paper.score?.finalScore ?? "n/a"}/100 - ${truncate(paper.title, 86)} (${paper.year || "n.d."})`
      ),
      citations: topPapers.map(paperLabel)
    },
    ...fallbackFindingSlides,
    {
      id: "evidence-strength",
      eyebrow: "Evidence strength",
      title: "Confidence should be interpreted as evidence triage, not final adjudication",
      subtitle: "Useful, but not a substitute for full-text review",
      bullets: synthesis?.areasOfAgreement.length
        ? [
            "Areas of agreement across the retrieved set:",
            ...synthesis.areasOfAgreement.slice(0, 3),
            "Confidence remains limited by abstract-only analysis and metadata inference."
          ]
        : [
        "Higher confidence requires topical overlap, recent publication date, stronger publication type, and multiple supporting papers.",
        "Reviews, meta-analyses, clinical trials, and journal articles receive different evidence weights where metadata supports it.",
        "Citation counts are used where available, primarily through OpenAlex, but are a secondary signal.",
        "Full-text review is needed for methods, populations, outcomes, safety caveats, and disagreement."
      ],
      citations: topPapers.slice(0, 3).map(paperLabel)
    },
    {
      id: "risks-and-next-steps",
      eyebrow: "Risks and next steps",
      title: "A full research pass should validate methods, outcomes, and disagreement before decisions",
      bullets: synthesis
        ? [...synthesis.uncertainties.slice(0, 3), ...synthesis.nextSteps.slice(0, 3)]
        : [
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
