export type ScholarlySource = "pubmed" | "openalex" | "mock";

export type OutputType = "brief" | "deck" | "both";

export type DataMode = "live" | "mock-fallback" | "empty";

export type ScoreBreakdown = {
  relevanceScore: number;
  recencyScore: number;
  evidenceScore: number;
  citationScore: number;
  finalScore: number;
  relevancePenalty: number;
  explanation: string[];
};

export type Paper = {
  id: string;
  source: ScholarlySource;
  title: string;
  authors: string[];
  journal?: string;
  year?: number;
  publicationDate?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  publicationTypes: string[];
  citationCount?: number;
  isPreprint?: boolean;
  likelyPeerReviewed?: boolean;
  keyFinding?: string;
  method?: string;
  limitation?: string;
  relevanceToQuestion?: string;
  reasonIncluded?: string;
  score?: ScoreBreakdown;
};

export type ExcludedPaper = {
  paper: Paper;
  reason: string;
};

export type EvidenceClaim = {
  claim: string;
  supportingPaperIds: string[];
  confidence: "Low" | "Moderate" | "High";
  explanation: string;
  limitations: string;
};

export type ResearchTheme = {
  id: string;
  title: string;
  headline: string;
  summary: string;
  supportingPaperIds: string[];
  evidenceLevel: "Emerging" | "Moderate" | "Strong";
  methods: string[];
  implications: string[];
  limitations: string[];
};

export type TopicPrimer = {
  topic: string;
  overview: string;
  whyItMatters: string;
  currentFocus: string[];
  keyTerms: string[];
};

export type ResearchFinding = {
  id: string;
  title: string;
  takeaway: string;
  explanation: string;
  whyItMatters: string;
  supportingDetails: string[];
  supportingPaperIds: string[];
  evidenceLevel: ResearchTheme["evidenceLevel"];
  limitations: string[];
};

export type PaperInsight = {
  paperId: string;
  roleInLiterature: string;
  studyDesignOrApproach: string;
  mainResult: string;
  mechanismOrExplanation: string;
  limitations: string;
  presentableTakeaway: string;
};

export type ResearchSynthesis = {
  topicPrimer: TopicPrimer;
  executiveAnswer: string;
  keyTakeaways: string[];
  findings: ResearchFinding[];
  themes: ResearchTheme[];
  paperInsights?: PaperInsight[];
  synthesisMode?: "deterministic" | "expert-agent";
  areasOfAgreement: string[];
  uncertainties: string[];
  researchGaps: string[];
  nextSteps: string[];
};

export type DeckPreviewSlide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  citations: string[];
  footnote?: string;
};

export type SearchMethodology = {
  generatedQueries: string[];
  sources: string[];
  dateRange: {
    startYear: number;
    endYear: number;
  };
  includePreprints: boolean;
  maxPapers: number;
  analysisDepth: "abstract-only" | "full-text";
  notes: string[];
};

export type ResearchRequest = {
  question: string;
  startYear: number;
  endYear: number;
  maxPapers: number;
  includePreprints: boolean;
  outputType: OutputType;
};

export type ResearchResult = {
  question: string;
  dataMode: DataMode;
  methodology: SearchMethodology;
  papers: Paper[];
  excludedPapers: ExcludedPaper[];
  synthesis: ResearchSynthesis;
  evidenceTable: EvidenceClaim[];
  briefMarkdown: string;
  deckOutlineMarkdown: string;
  deckSlides: DeckPreviewSlide[];
  usedMockData: boolean;
  warnings: string[];
};

export type GeneratedQuery = {
  label: string;
  query: string;
};
