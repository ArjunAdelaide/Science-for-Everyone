import type {
  DeckPreviewSlide,
  EvidenceClaim,
  Paper,
  ResearchFinding,
  ResearchSynthesis,
  ResearchTheme,
  SearchMethodology
} from "@/lib/types/paper";
import { finalizeDeckSlides } from "@/lib/synthesis/deckQuality";

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const sliced = text.slice(0, maxLength - 3).trim();
  const lastSpace = sliced.lastIndexOf(" ");
  return `${(lastSpace > 48 ? sliced.slice(0, lastSpace) : sliced).trim()}...`;
}

function cite(paper?: Paper): string {
  if (!paper) {
    return "Source unavailable";
  }

  const leadAuthor = paper.authors[0]?.split(" ").pop() || "Unknown";
  return `${leadAuthor} et al., ${paper.year || "n.d."}`;
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

function scientificDetailsForFinding(finding: ResearchFinding, synthesis?: ResearchSynthesis): string[] {
  const insights = (synthesis?.paperInsights || []).filter((insight) => finding.supportingPaperIds.includes(insight.paperId));
  const detailSet = new Set<string>();

  insights.slice(0, 3).forEach((insight) => {
    if (insight.studyDesignOrApproach && !/^(article|journal article|review|Publication type metadata:.*)$/i.test(insight.studyDesignOrApproach.trim())) {
      detailSet.add(`Method: ${truncate(insight.studyDesignOrApproach, 145)}`);
    }
    if (insight.mainResult) detailSet.add(`Source context: ${truncate(insight.mainResult, 145)}`);
    if (insight.mechanismOrExplanation) detailSet.add(`Mechanism: ${truncate(insight.mechanismOrExplanation, 145)}`);
  });

  finding.supportingDetails.slice(0, 3).forEach((detail) => detailSet.add(`Evidence detail: ${detail}`));
  return Array.from(detailSet).slice(0, 2);
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
  const findingSlides = findings.slice(0, 3).map((finding, index) => {
    const supportingPapers = findingPapers(finding, papers);
    const scientificDetails = scientificDetailsForFinding(finding, synthesis);

    return {
      id: `finding-${index + 1}`,
      eyebrow: `Teaching point ${index + 1}`,
      title: truncate(finding.title, 125),
      subtitle: `${finding.evidenceLevel} signal | ${supportingPapers.length} mapped source${supportingPapers.length === 1 ? "" : "s"}`,
      bullets: [
        `What to learn: ${finding.takeaway}`,
        scientificDetails[0] || `How the evidence supports it: ${truncate(finding.explanation, 145)}`,
        scientificDetails[1] || `Why it matters: ${truncate(finding.whyItMatters, 145)}`,
        `Watch-out: ${finding.limitations[0]}`,
        `Source signal: ${supportingPapers.slice(0, 2).map(cite).join("; ") || "mapped abstracts unavailable"}`
      ],
      citations: [],
      footnote: "Claim is generated only from retrieved abstract and metadata fields."
    };
  });
  const themeSlides = themes.slice(0, 3).map((theme, index) => {
    const supportingPapers = themePapers(theme, papers);

    return {
      id: `finding-${index + 1}`,
      eyebrow: `Teaching point ${index + 1}`,
      title: truncate(theme.headline, 125),
      subtitle: `${theme.evidenceLevel} signal | ${supportingPapers.length} mapped source${supportingPapers.length === 1 ? "" : "s"}`,
      bullets: [
        `What to learn: ${theme.summary}`,
        `Method signal: ${theme.methods.join(", ") || "metadata varies across records"}.`,
        `Why it matters: ${theme.implications.slice(0, 2).join(" ")}`,
        `Watch-out: ${theme.limitations.join(" ")}`,
        `Source signal: ${supportingPapers.slice(0, 2).map(cite).join("; ") || "mapped abstracts unavailable"}`
      ],
      citations: [],
      footnote: "Claim is generated only from retrieved abstract and metadata fields."
    };
  });
  const claimSlides = claims.map((claim, index) => {
    const supportingPapers = claimPapers(claim, papers);

    return {
      id: `finding-${index + 1}`,
      eyebrow: `Teaching point ${index + 1}`,
      title: truncate(claim.claim, 125),
      subtitle: `${claim.confidence} confidence based on ${supportingPapers.length} mapped source${supportingPapers.length === 1 ? "" : "s"}`,
      bullets: [
        `What to learn: ${claim.explanation}`,
        `Source signal: ${supportingPapers.map(cite).join("; ") || "no supporting papers mapped by the synthesis step"}.`,
        `Watch-out: ${claim.limitations}`
      ],
      citations: [],
      footnote: "Claim is generated only from retrieved abstract and metadata fields."
    };
  });
  const fallbackFindingSlides = findingSlides.length ? findingSlides : themeSlides.length ? themeSlides : claimSlides;

  const rawSlides: DeckPreviewSlide[] = [
    {
      id: "title",
      eyebrow: "EzResearch evidence deck",
      title: truncate(question, 125),
      subtitle: `${methodology.dateRange.startYear}-${methodology.dateRange.endYear} | ${papers.length} sources | short teaching brief`,
      bullets: [
        findings[0] ? `Main answer: ${findings[0].takeaway}` : "Main answer: the current records are too sparse for a strong source-backed claim.",
        primer?.whyItMatters || "Use this as a source-grounded learning deck, not a full systematic review.",
        `Evidence boundary: abstract-and-metadata review of ${papers.length} ranked scholarly record${papers.length === 1 ? "" : "s"}.`
      ],
      citations: [],
      footnote: "Short teaching deck; every claim should be validated against full text before high-stakes use."
    },
    {
      id: "topic-primer",
      eyebrow: "What this is",
      title: primer ? `${primer.topic} in plain English` : "The topic in plain English",
      subtitle: "The minimum context needed before the findings",
      bullets: [
        `Core idea: ${primer?.overview || "The retrieved papers define the topic through the highest-scoring abstracts and metadata."}`,
        ...(primer?.currentFocus.slice(0, 2).map((focus) => `Current focus: ${focus}`) || []),
        primer?.keyTerms.length ? `Vocabulary: ${primer.keyTerms.slice(0, 8).join(", ")}.` : "Vocabulary: key terms were limited in the retrieved metadata.",
        primer?.whyItMatters ? `Why it matters: ${primer.whyItMatters}` : `Evidence base: ${sourceMix(papers) || "available scholarly sources"}.`
      ],
      citations: [],
      footnote: "Primer is generated from retrieved titles, abstracts, publication types, and metadata."
    },
    ...fallbackFindingSlides,
    {
      id: "evidence-and-limits",
      eyebrow: "Evidence and limits",
      title: "Use the findings as a teaching map, not a final review",
      subtitle: `${sourceMix(papers)} | ${evidenceMix(papers)}`,
      bullets: [
        paperInsights.length
          ? `Strongest source: ${(() => {
              const insight = paperInsights[0];
              const paper = papers.find((candidate) => candidate.id === insight.paperId);
              return `${cite(paper)} - ${truncate(insight.presentableTakeaway || insight.mainResult, 120)}`;
            })()}`
          : `Strongest source: ${topPapers[0] ? `${cite(topPapers[0])} - ${truncate(topPapers[0].title, 120)}` : "no ranked papers available"}`,
        ...paperInsights.slice(1, 3).map((insight, index) => {
            const paper = papers.find((candidate) => candidate.id === insight.paperId);
            return `Supporting source ${index + 2}: ${cite(paper)} - ${truncate(insight.presentableTakeaway || insight.mainResult, 110)}`;
          }),
        paperInsights.length === 0 && topPapers[1]
          ? `Supporting source: ${cite(topPapers[1])} - ${truncate(topPapers[1].title, 110)}`
          : "",
        `Method note: queries included ${methodology.generatedQueries.slice(0, 2).join("; ")}.`,
        methodology.includePreprints
          ? "Limit: preprints were allowed when retrieved, so publication status needs review."
          : "Limit: likely preprints were excluded when metadata supported that inference.",
        synthesis?.uncertainties[0] || "Limit: abstracts omit details that can change interpretation, including methods, endpoints, and negative findings."
      ].filter(Boolean),
      citations: [],
      footnote: "References are generated only from retrieved metadata."
    }
  ];

  return finalizeDeckSlides(rawSlides, { papers });
}
