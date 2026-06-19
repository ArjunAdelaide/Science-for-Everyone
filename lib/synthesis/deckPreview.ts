import type {
  DeckPreviewSlide,
  EvidenceClaim,
  Paper,
  ResearchFinding,
  ResearchSynthesis,
  ResearchTheme,
  SearchMethodology
} from "@/lib/types/paper";

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

function findingPapers(finding: ResearchFinding, papers: Paper[]): Paper[] {
  return finding.supportingPaperIds
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
  const findings = synthesis?.findings || [];
  const primer = synthesis?.topicPrimer;
  const paperInsights = synthesis?.paperInsights || [];
  const topClaim = findings[0]?.title || claims[0]?.claim;
  const findingSlides = findings.slice(0, 5).map((finding, index) => {
    const supportingPapers = findingPapers(finding, papers);

    return {
      id: `finding-${index + 1}`,
      eyebrow: `Finding ${index + 1}`,
      title: truncate(finding.title, 125),
      subtitle: `${finding.evidenceLevel} abstract-level signal based on ${supportingPapers.length} source${supportingPapers.length === 1 ? "" : "s"}`,
      bullets: [
        `Finding: ${finding.takeaway}`,
        `Interpretation: ${finding.explanation}`,
        `Why it matters: ${finding.whyItMatters}`,
        ...finding.supportingDetails.slice(0, 2).map((detail) => `Source detail: ${detail}`),
        `Support: ${supportingPapers.map(cite).join("; ") || "no supporting papers mapped by the synthesis step"}.`,
        `Caveat: ${finding.limitations[0]}`
      ],
      citations: supportingPapers.map(paperLabel),
      footnote: "Claim is generated only from retrieved abstract and metadata fields."
    };
  });
  const themeSlides = themes.slice(0, 4).map((theme, index) => {
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
            `Limitation: ${theme.limitations.join(" ")}`
          ],
          citations: supportingPapers.map(paperLabel),
          footnote: "Claim is generated only from retrieved abstract and metadata fields."
        };
      });
  const claimSlides = claims.map((claim, index) => {
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
  const fallbackFindingSlides = findingSlides.length ? findingSlides : themeSlides.length ? themeSlides : claimSlides;

  return [
    {
      id: "title",
      eyebrow: "EzResearch evidence deck",
      title: truncate(question, 125),
      subtitle: `${methodology.dateRange.startYear}-${methodology.dateRange.endYear} | ${papers.length} sources analysed`,
      bullets: [
        "A presentation-ready briefing on what the retrieved literature says.",
        "Designed to teach the topic first, then show the evidence behind each finding.",
        "All claims remain tied to retrieved paper metadata and abstracts."
      ],
      citations: []
    },
    {
      id: "topic-primer",
      eyebrow: "Topic primer",
      title: primer ? `What to know about ${primer.topic}` : "What to know before reading the findings",
      subtitle: "Plain-language orientation for a non-specialist audience",
      bullets: [
        primer?.overview || "The retrieved papers define the topic through the highest-scoring abstracts and metadata.",
        ...(primer?.currentFocus.slice(0, 3) || []),
        primer?.keyTerms.length ? `Key terms to listen for: ${primer.keyTerms.slice(0, 6).join(", ")}.` : "Key terms were limited in the retrieved metadata."
      ],
      citations: topPapers.slice(0, 3).map(paperLabel),
      footnote: "Primer is generated from retrieved titles, abstracts, publication types, and metadata."
    },
    {
      id: "why-it-matters",
      eyebrow: "Why it matters",
      title: primer ? `Why ${primer.topic} matters now` : "Why this topic matters now",
      subtitle: "The practical reason to care about the literature",
      bullets: [
        primer?.whyItMatters || "The literature is moving quickly, and the deck compresses the retrieved evidence into a presenter-friendly structure.",
        `The current evidence base contains ${papers.length} ranked source${papers.length === 1 ? "" : "s"} from ${sourceMix(papers) || "available scholarly sources"}.`,
        findings[0]
          ? `The strongest finding to start with: ${findings[0].title}.`
          : "No strong finding was generated from the current evidence base.",
        "The next slides explain the main findings before moving into methodology and limitations."
      ],
      citations: topPapers.slice(0, 3).map(paperLabel)
    },
    {
      id: "executive-takeaway",
      eyebrow: "Answer first",
      title: topClaim
        ? truncate(`The headline finding: ${topClaim}`, 125)
        : "The search produced an auditable evidence base, but no strong claim passed synthesis.",
      subtitle: "The one-slide answer before the detail",
      bullets: [
        synthesis?.executiveAnswer || `${papers.length} likely scholarly records were analysed after deduplication, preprint filtering, and transparent scoring.`,
        ...(synthesis?.keyTakeaways.slice(0, 2) || []),
        "The following finding slides unpack what this means in practical terms."
      ],
      citations: topPapers.slice(0, 3).map(paperLabel),
      footnote: "Takeaway is constrained to retrieved metadata and abstracts."
    },
    ...fallbackFindingSlides,
    {
      id: "paper-insights",
      eyebrow: "Key papers in context",
      title: "What the most useful papers contribute to the story",
      subtitle: synthesis?.synthesisMode === "expert-agent" ? "Expert-agent interpretation of retrieved abstracts" : "Abstract-derived source interpretation",
      bullets: paperInsights.length
        ? paperInsights.slice(0, 5).map((insight) => {
            const paper = papers.find((candidate) => candidate.id === insight.paperId);
            return `${cite(paper)}: ${truncate(insight.presentableTakeaway || insight.mainResult, 145)}`;
          })
        : topPapers.map((paper) => `${cite(paper)}: ${truncate(paper.reasonIncluded || paper.abstract || paper.title, 145)}`),
      citations: paperInsights.length
        ? paperInsights
            .slice(0, 5)
            .map((insight) => papers.find((paper) => paper.id === insight.paperId))
            .filter((paper): paper is Paper => Boolean(paper))
            .map(paperLabel)
        : topPapers.map(paperLabel),
      footnote: "Paper roles are constrained to retrieved abstract and metadata fields."
    },
    {
      id: "evidence-base",
      eyebrow: "Source landscape",
      title: "The strongest papers behind the presentation",
      subtitle: `${sourceMix(papers)} | ${evidenceMix(papers)}`,
      bullets: topPapers.map(
        (paper) =>
          `${paper.score?.finalScore ?? "n/a"}/100 - ${truncate(paper.title, 86)} (${paper.year || "n.d."})`
      ),
      citations: topPapers.map(paperLabel)
    },
    {
      id: "what-to-watch",
      eyebrow: "What to watch",
      title: "What remains unresolved after the current literature scan",
      subtitle: "Questions a presenter should be ready to answer",
      bullets: synthesis?.areasOfAgreement.length
        ? [
            "Areas where the retrieved set points in a similar direction:",
            ...synthesis.areasOfAgreement.slice(0, 2),
            ...(synthesis.uncertainties.slice(0, 2) || [])
          ]
        : [
        "Which findings persist after full-text review?",
        "Which methods, models, populations, or outcome measures explain disagreement?",
        "Which findings are mature enough for decisions, and which are still early signals?"
      ],
      citations: topPapers.slice(0, 3).map(paperLabel)
    },
    {
      id: "methodology",
      eyebrow: "Methodology",
      title: "How the deck was built",
      subtitle: methodology.sources.join(" + "),
      bullets: [
        `Generated queries: ${methodology.generatedQueries.join("; ")}`,
        methodology.includePreprints
          ? "Preprints were allowed when retrieved."
          : "Likely preprints/repository records were excluded when metadata supported that inference.",
        "Ranking uses relevance, recency, publication type, citation count, and source-quality signals.",
        "Likely peer-reviewed status is inferred from publication/source metadata, not asserted with certainty."
      ],
      citations: []
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
