import type { Paper, ResearchSynthesis, ResearchTheme, SearchMethodology } from "@/lib/types/paper";
import { extractKeywords } from "@/lib/scholarly/query";

const THEME_DEFINITIONS = [
  {
    id: "conceptual-landscape",
    title: "Conceptual landscape",
    presenterFrame: "Define the intellectual terrain before moving into individual papers.",
    patterns: [
      /framework/i,
      /theory/i,
      /model/i,
      /mechanism/i,
      /pathway/i,
      /concept/i,
      /landscape/i,
      /overview/i,
      /classification/i,
      /taxonomy/i
    ]
  },
  {
    id: "methods-and-measurement",
    title: "Methods and measurement",
    presenterFrame: "Explain how the field is producing evidence and where measurement choices matter.",
    patterns: [
      /method/i,
      /measurement/i,
      /assay/i,
      /dataset/i,
      /sample/i,
      /cohort/i,
      /platform/i,
      /delivery/i,
      /vector/i,
      /viral/i,
      /aav/i,
      /lentiviral/i,
      /lipid/i,
      /nanoparticle/i,
      /polymer/i,
      /carrier/i
    ]
  },
  {
    id: "findings-and-effects",
    title: "Findings and effects",
    presenterFrame: "Translate the strongest observed findings into a clear evidence storyline.",
    patterns: [
      /efficacy/i,
      /efficiency/i,
      /improv/i,
      /increase/i,
      /decrease/i,
      /outcome/i,
      /response/i,
      /editing/i,
      /specificity/i,
      /activity/i,
      /potency/i
    ]
  },
  {
    id: "constraints-and-risks",
    title: "Constraints and risks",
    presenterFrame: "Make caveats visible early so the deck sounds credible rather than overconfident.",
    patterns: [
      /safety/i,
      /toxicity/i,
      /immune/i,
      /off-target/i,
      /adverse/i,
      /risk/i,
      /challenge/i,
      /limitation/i,
      /barrier/i,
      /dose/i
    ]
  },
  {
    id: "application-and-translation",
    title: "Application and translation",
    presenterFrame: "Connect the research record to where it may matter in practice.",
    patterns: [
      /application/i,
      /applied/i,
      /implementation/i,
      /translation/i,
      /clinical/i,
      /patient/i,
      /therapy/i,
      /therapeutic/i,
      /disease/i,
      /treatment/i,
      /trial/i,
      /in vivo/i,
      /ex vivo/i,
      /human/i
    ]
  },
  {
    id: "evidence-synthesis",
    title: "Review-level evidence and field synthesis",
    presenterFrame: "Use reviews and syntheses to separate field-level patterns from isolated studies.",
    patterns: [/review/i, /meta-analysis/i, /systematic/i, /landscape/i, /overview/i, /consensus/i]
  }
] as const;

const STOPWORDS = new Set([
  "about",
  "after",
  "analysis",
  "based",
  "between",
  "could",
  "data",
  "effect",
  "from",
  "have",
  "into",
  "journal",
  "method",
  "paper",
  "research",
  "result",
  "study",
  "that",
  "their",
  "these",
  "this",
  "using",
  "with",
  "were",
  "what",
  "when",
  "where",
  "which"
]);

function textForPaper(paper: Paper): string {
  return `${paper.title} ${paper.abstract || ""} ${paper.publicationTypes.join(" ")} ${paper.journal || ""}`;
}

function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3).trim()}...`;
}

function cite(paper: Paper): string {
  const leadAuthor = paper.authors[0]?.split(" ").pop() || "Unknown";
  return `${leadAuthor} et al. (${paper.year || "n.d."})`;
}

function strongestSentence(papers: Paper[], queryKeywords: string[]): string {
  const sentences = papers
    .flatMap((paper) => (paper.abstract || paper.keyFinding || paper.title).split(/(?<=[.!?])\s+/).map((sentence) => ({ sentence, paper })))
    .map(({ sentence, paper }) => {
      const lower = sentence.toLowerCase();
      const keywordHits = queryKeywords.filter((keyword) => lower.includes(keyword.toLowerCase())).length;
      const actionHits = /(improv|increase|decrease|reduce|show|demonstrat|suggest|enable|associate|identify)/i.test(sentence) ? 1 : 0;
      return { sentence: sentence.trim(), paper, score: keywordHits * 3 + actionHits + (paper.score?.finalScore || 0) / 100 };
    })
    .filter((item) => item.sentence.length > 32)
    .sort((a, b) => b.score - a.score);

  return sentences[0]?.sentence || papers[0]?.keyFinding || papers[0]?.title || "The retrieved papers provide directional abstract-level evidence.";
}

function confidenceFor(papers: Paper[]): ResearchTheme["evidenceLevel"] {
  const strongTypes = papers.filter((paper) => /review|meta-analysis|systematic|clinical trial|randomized/i.test(paper.publicationTypes.join(" "))).length;
  const highScoring = papers.filter((paper) => (paper.score?.finalScore || 0) >= 70).length;

  if (papers.length >= 3 && (strongTypes >= 1 || highScoring >= 2)) return "Strong";
  if (papers.length >= 2 || highScoring >= 1) return "Moderate";
  return "Emerging";
}

function commonMethods(papers: Paper[]): string[] {
  const methodTerms = [
    "systematic review",
    "meta-analysis",
    "clinical trial",
    "review",
    "journal article",
    "in vivo",
    "ex vivo",
    "lipid nanoparticle",
    "viral vector",
    "AAV",
    "nanoparticle",
    "cell model",
    "animal model"
  ];
  const text = papers.map(textForPaper).join(" ").toLowerCase();
  const matched = methodTerms.filter((term) => text.includes(term.toLowerCase()));
  const publicationTypes = papers.flatMap((paper) => paper.publicationTypes).filter(Boolean);
  return Array.from(new Set([...matched, ...publicationTypes])).slice(0, 4);
}

function topConcepts(papers: Paper[], question: string): string[] {
  const queryWords = new Set(extractKeywords(question).map((keyword) => keyword.toLowerCase()));
  const counts = new Map<string, number>();

  papers
    .map(textForPaper)
    .join(" ")
    .toLowerCase()
    .match(/\b[a-z][a-z-]{4,}\b/g)
    ?.forEach((word) => {
      if (STOPWORDS.has(word) || queryWords.has(word)) return;
      counts.set(word, (counts.get(word) || 0) + 1);
    });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word);
}

function papersForTheme(papers: Paper[], patterns: readonly RegExp[]): Paper[] {
  return papers.filter((paper) => patterns.some((pattern) => pattern.test(textForPaper(paper)))).slice(0, 5);
}

function buildTheme(
  definition: { id: string; title: string; presenterFrame?: string; patterns: readonly RegExp[] },
  papers: Paper[],
  question: string
): ResearchTheme {
  const queryKeywords = extractKeywords(question);
  const concepts = topConcepts(papers, question);
  const leadSentence = strongestSentence(papers, queryKeywords);
  const citations = papers.slice(0, 3).map(cite).join("; ");
  const evidenceLevel = confidenceFor(papers);

  return {
    id: definition.id,
    title: definition.title,
    headline: `${definition.title} are supported by ${papers.length} retrieved source${papers.length === 1 ? "" : "s"}.`,
    summary: `${truncate(leadSentence, 220)} This theme is supported by ${citations || "the ranked evidence set"}.`,
    supportingPaperIds: papers.map((paper) => paper.id),
    evidenceLevel,
    methods: commonMethods(papers),
    implications: [
      concepts.length
        ? `${definition.presenterFrame || "Explain how this theme changes the interpretation of the retrieved evidence base."} Anchor the discussion in recurring concepts such as ${concepts.slice(0, 3).join(", ")}.`
        : definition.presenterFrame || "Explain how this theme changes the interpretation of the retrieved evidence base.",
      evidenceLevel === "Strong"
        ? "This is a stronger briefing theme because it has multiple supporting records or stronger publication-type metadata."
        : "This should be presented as directional until full text validates methods, samples, and outcomes."
    ],
    limitations: [
      "Theme is inferred from titles, abstracts, publication types, and source metadata.",
      "Full-text review is required to confirm study design, population, endpoints, and caveats."
    ]
  };
}

function buildFallbackThemes(question: string, papers: Paper[]): ResearchTheme[] {
  return papers.slice(0, 3).map((paper, index) => buildTheme(
    {
      id: `paper-signal-${index + 1}`,
      title: `Evidence signal ${index + 1}`,
      patterns: []
    },
    [paper],
    question
  ));
}

export function buildResearchSynthesis(
  question: string,
  methodology: SearchMethodology,
  papers: Paper[]
): ResearchSynthesis {
  if (papers.length === 0) {
    return {
      executiveAnswer: "No papers passed the current retrieval and filtering pipeline, so no evidence-grounded synthesis can be produced.",
      keyTakeaways: ["Broaden the query, expand the date range, or allow preprints if appropriate."],
      themes: [],
      areasOfAgreement: [],
      uncertainties: ["The evidence base is empty after filtering."],
      researchGaps: ["No source-backed gap analysis is possible without retrieved papers."],
      nextSteps: ["Retry with a broader topic or lower filter strictness."]
    };
  }

  const themes = THEME_DEFINITIONS.map((definition) => {
    const matched = papersForTheme(papers, definition.patterns);
    return matched.length ? buildTheme(definition, matched, question) : null;
  }).filter((theme): theme is ResearchTheme => Boolean(theme));

  const finalThemes = themes.length > 0 ? themes.slice(0, 4) : buildFallbackThemes(question, papers);
  const topConceptList = topConcepts(papers, question);
  const topTheme = finalThemes[0];

  return {
    executiveAnswer: topTheme
      ? `${topTheme.summary} Overall, the retrieved evidence should be treated as ${methodology.analysisDepth} research triage rather than a full systematic review.`
      : "The retrieved evidence is relevant, but the current records do not form a strong theme without full-text review.",
    keyTakeaways: [
      `${papers.length} ranked source${papers.length === 1 ? "" : "s"} were synthesised into ${finalThemes.length} briefing theme${finalThemes.length === 1 ? "" : "s"}.`,
      topTheme ? `${topTheme.title} is the strongest initial storyline.` : "The evidence base is too thin for a strong storyline.",
      topConceptList.length ? `Recurring concepts include ${topConceptList.slice(0, 5).join(", ")}.` : "Recurring concepts were limited in metadata/abstract text."
    ],
    themes: finalThemes,
    areasOfAgreement: finalThemes.slice(0, 3).map((theme) => `${theme.title}: ${theme.headline}`),
    uncertainties: [
      "Abstracts often omit detailed methods, populations, endpoints, negative findings, and safety caveats.",
      "Retrieved metadata cannot guarantee peer-review status or resolve conflicting findings across full texts.",
      "Citation counts and indexing coverage can lag the newest literature."
    ],
    researchGaps: [
      "Validate whether the highest-scoring papers use comparable methods, models, and outcome definitions.",
      "Check whether newer or niche records are missing from PubMed/OpenAlex indexing.",
      "Identify disagreements that only appear in full-text results, tables, and supplementary materials."
    ],
    nextSteps: [
      "Read the full text of the top cited and highest-scoring sources.",
      "Add Semantic Scholar/Crossref/Europe PMC to improve coverage and citation context.",
      "Extract methods, sample/model details, endpoints, limitations, and direct claims into a structured evidence matrix."
    ]
  };
}
