import type {
  Paper,
  PaperInsight,
  ResearchFinding,
  ResearchSynthesis,
  ResearchTheme,
  SearchMethodology,
  TopicPrimer
} from "@/lib/types/paper";
import { polishDeckText } from "@/lib/synthesis/deckQuality";

type ExpertSynthesisResult = {
  synthesis: ResearchSynthesis;
  usedExpertModel: boolean;
  warning?: string;
};

type ExpertResponse = {
  topicPrimer: TopicPrimer;
  executiveAnswer: string;
  keyTakeaways: string[];
  findings: ResearchFinding[];
  paperInsights: PaperInsight[];
  areasOfAgreement: string[];
  uncertainties: string[];
  researchGaps: string[];
  nextSteps: string[];
};

const DEFAULT_MODEL = "gpt-4.1-mini";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_EXPERT_SYNTHESIS_TIMEOUT_MS = 25_000;

class ExpertSynthesisApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ExpertSynthesisApiError";
  }
}

function expertSynthesisEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY) && process.env.EZRESEARCH_ENABLE_EXPERT_SYNTHESIS === "true";
}

function expertSynthesisRequired(): boolean {
  return process.env.EZRESEARCH_REQUIRE_EXPERT_SYNTHESIS === "true";
}

function modelName(): string {
  return process.env.OPENAI_RESEARCH_MODEL || DEFAULT_MODEL;
}

function expertSynthesisTimeoutMs(): number {
  const configured = Number(process.env.OPENAI_EXPERT_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 3000 ? configured : DEFAULT_EXPERT_SYNTHESIS_TIMEOUT_MS;
}

function expertFallbackWarning(): string {
  return "Expert synthesis was unavailable, so EzResearch used deterministic abstract-and-metadata synthesis. Citations and claims remain grounded in retrieved records.";
}

function expertUnavailableMessage(): string {
  return "Expert research synthesis is required but unavailable. Check OPENAI_API_KEY and try again.";
}

function candidateModels(): string[] {
  return Array.from(new Set([modelName()].filter(Boolean)));
}

function truncate(text: string | undefined, maxLength: number): string {
  if (!text) return "";
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3).trim()}...`;
}

function paperForPrompt(paper: Paper, index: number) {
  return {
    index: index + 1,
    id: `P${index + 1}`,
    sourceRecordId: paper.id,
    title: paper.title,
    authors: paper.authors.slice(0, 8),
    journal: paper.journal || null,
    year: paper.year || null,
    doi: paper.doi || null,
    publicationTypes: paper.publicationTypes,
    citationCount: paper.citationCount || null,
    likelyPeerReviewed: paper.likelyPeerReviewed || false,
    abstract: truncate(paper.abstract, 650),
    score: paper.score
      ? {
          finalScore: paper.score.finalScore,
          explanation: paper.score.explanation.slice(0, 4)
        }
      : null
  };
}

function buildExpertPrompt(question: string, methodology: SearchMethodology, papers: Paper[], baseSynthesis: ResearchSynthesis): string {
  const promptPapers = papers.slice(0, 3).map(paperForPrompt);

  return JSON.stringify(
    {
      task: "Act as a scholarly research intelligence team. Produce a short, citation-auditable teaching report from the supplied records.",
      nonNegotiables: [
        "Use only the supplied paper records. Do not invent citations, journals, authors, DOIs, statistics, effect sizes, clinical claims, or findings.",
        "Every finding must cite supportingPaperIds that exist in the supplied papers.",
        "The output must directly answer the user's question or keyword search. Do not hide behind methodology language.",
        "Use the short paper IDs supplied as P1, P2, and P3 in supportingPaperIds.",
        "The report should be short and information-dense: teach mechanisms, methods, implications, and caveats in plain language.",
        "Keep the full JSON response under 800 words. Prefer short sentences over exhaustive prose.",
        "Return exactly 2 findings. Do not include extra sections beyond the requested JSON keys.",
        "Write like a senior research analyst preparing a three-minute teaching briefing: precise, direct, explanatory, and useful aloud.",
        "Clearly preserve abstract-only limitations. If full-text methods/results are needed, say so.",
        "Prefer mechanistic explanation and study design interpretation over generic validity language.",
        "Avoid empty phrases such as 'more research is needed', 'rapidly evolving', or 'promising' unless you state exactly what source-backed detail makes that true.",
        "For each finding, include at least one method/design detail and one scientific result or mechanism detail when the abstract supports it.",
        "Before returning JSON, proofread every field for spelling, grammar, duplicated words, awkward phrasing, and vague AI filler.",
        "Do not claim full-text analysis. This system only has abstracts and metadata.",
        "Avoid overconfident language such as proves, guarantees, or conclusively demonstrates unless that exact claim is supported by the supplied record."
      ],
      agentRoles: {
        domainScientist:
          "Infer mechanisms, methods, biological/clinical meaning, and caveats from the abstracts without overclaiming.",
        evidenceAuditor: "Keep every claim grounded in paper IDs and downgrade confidence when support is thin.",
        narrativeStrategist: "Build a short teaching arc: what the topic is, the direct answer, the key findings, and what to verify.",
        slideStrategist:
          "Turn each finding into one clear slide job. Titles must be answer-first and teach the conclusion, not labels like 'Finding 1' or 'Overview'.",
        proofreaderEditor:
          "Remove filler, repeated phrasing, typos, empty intensifiers, and awkward syntax while preserving scientific caution.",
        finalDeckValidator:
          "Check that titles are non-empty, bullets teach something specific, every cited paper ID is valid, and no unsupported full-text claim remains."
      },
      question,
      methodology,
      deterministicBaseline: {
        topicPrimer: baseSynthesis.topicPrimer,
        findings: baseSynthesis.findings.slice(0, 4)
      },
      papers: promptPapers,
      requiredOutputShape: {
        topicPrimer: {
          topic: "short topic label",
          overview: "40-70 word plain-language primer grounded in abstracts",
          whyItMatters: "25-50 word explanation of scientific, clinical, technical, or societal importance",
          currentFocus: ["3-5 concrete focus areas in the retrieved literature"],
          keyTerms: ["6-10 important terms from the records"]
        },
        executiveAnswer: "50-90 word answer-first synthesis with caveats",
        keyTakeaways: ["exactly 3 presenter-ready takeaways"],
        findings: [
          {
            id: "finding-1",
            title: "answer-first slide title, 8-14 words, not a section label",
            takeaway: "direct answer in 1 short sentence, written for a presenter to say aloud",
            explanation: "1-2 sentence explanation of how the supplied evidence supports this finding",
            whyItMatters: "1 sentence explaining why this finding matters",
            supportingDetails: [
              "exactly 2 concrete abstract-derived details; each should state a method, study design, result, mechanism, population/model, endpoint, or limitation"
            ],
            supportingPaperIds: ["short paper ids only: P1, P2, or P3"],
            evidenceLevel: "Emerging | Moderate | Strong",
            limitations: ["specific limitation or validation need"]
          }
        ]
      }
    },
    null,
    2
  );
}

function extractResponseText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const response = value as { output_text?: unknown; output?: Array<{ content?: Array<{ text?: unknown }> }> };
  if (typeof response.output_text === "string") return response.output_text;

  return (
    response.output
      ?.flatMap((item) => item.content || [])
      .map((content) => (typeof content.text === "string" ? content.text : ""))
      .join("") || ""
  );
}

function parseExpertJson(text: string): ExpertResponse {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

  try {
    return JSON.parse(trimmed) as ExpertResponse;
  } catch {
    const withoutControlCharacters = trimmed.replace(/[\u0000-\u001f\u007f]/g, " ");
    return JSON.parse(withoutControlCharacters) as ExpertResponse;
  }
}

function asString(value: unknown, fallback = ""): string {
  const text = typeof value === "string" && value.trim() ? value.trim() : fallback;
  return polishDeckText(text);
}

function asStringArray(value: unknown, fallback: string[] = []): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => polishDeckText(item))
    : fallback.map((item) => polishDeckText(item));
}

function sanitizeTopicPrimer(value: unknown, fallback: TopicPrimer): TopicPrimer {
  const candidate = value && typeof value === "object" ? (value as Partial<TopicPrimer>) : {};
  return {
    topic: asString(candidate.topic, fallback.topic),
    overview: asString(candidate.overview, fallback.overview),
    whyItMatters: asString(candidate.whyItMatters, fallback.whyItMatters),
    currentFocus: asStringArray(candidate.currentFocus, fallback.currentFocus).slice(0, 6),
    keyTerms: asStringArray(candidate.keyTerms, fallback.keyTerms).slice(0, 12)
  };
}

function normalizePaperId(id: string, paperIds: Set<string>, promptIdToPaperId: Map<string, string>): string | undefined {
  if (paperIds.has(id)) return id;
  return promptIdToPaperId.get(id.toUpperCase());
}

function sanitizePaperInsights(
  value: unknown,
  paperIds: Set<string>,
  promptIdToPaperId: Map<string, string>,
  fallback: PaperInsight[]
): PaperInsight[] {
  if (!Array.isArray(value)) return fallback;

  const insights = value
    .map((item) => (item && typeof item === "object" ? (item as Partial<PaperInsight>) : null))
    .map((item) => {
      if (!item || typeof item.paperId !== "string") return null;
      const paperId = normalizePaperId(item.paperId, paperIds, promptIdToPaperId);
      return paperId ? { ...item, paperId } : null;
    })
    .filter((item): item is Partial<PaperInsight> & { paperId: string } => Boolean(item))
    .map((item) => ({
      paperId: item.paperId,
      roleInLiterature: asString(item.roleInLiterature, "Role not specified by expert synthesis."),
      studyDesignOrApproach: asString(item.studyDesignOrApproach, "Approach not available from abstract metadata."),
      mainResult: asString(item.mainResult, "Main result not available from abstract metadata."),
      mechanismOrExplanation: asString(item.mechanismOrExplanation, "Mechanism not available from abstract metadata."),
      limitations: asString(item.limitations, "Full-text validation required."),
      presentableTakeaway: asString(item.presentableTakeaway, "Use as supporting source context.")
    }));

  return insights.length ? insights : fallback;
}

function sanitizeFindings(
  value: unknown,
  paperIds: Set<string>,
  promptIdToPaperId: Map<string, string>,
  fallback: ResearchFinding[]
): ResearchFinding[] {
  if (!Array.isArray(value)) return fallback;

  const findings = value
    .map((item, index) => (item && typeof item === "object" ? ({ ...(item as Partial<ResearchFinding>), index }) : null))
    .filter(Boolean)
    .map((item) => {
      const supportingPaperIds = asStringArray(item?.supportingPaperIds)
        .map((id) => normalizePaperId(id, paperIds, promptIdToPaperId))
        .filter((id): id is string => Boolean(id))
        .slice(0, 6);
      if (supportingPaperIds.length === 0) return null;
      const evidenceLevel = item?.evidenceLevel === "Strong" || item?.evidenceLevel === "Moderate" ? item.evidenceLevel : "Emerging";

      return {
        id: asString(item?.id, `finding-${(item?.index || 0) + 1}`),
        title: asString(item?.title, "Evidence-backed finding"),
        takeaway: asString(item?.takeaway, "Finding requires full-text validation."),
        explanation: asString(item?.explanation, "Explanation generated from retrieved abstracts."),
        whyItMatters: asString(item?.whyItMatters, "This matters because it changes how the evidence base should be interpreted."),
        supportingDetails: asStringArray(item?.supportingDetails, ["Abstract-derived detail unavailable."]).slice(0, 5),
        supportingPaperIds,
        evidenceLevel,
        limitations: asStringArray(item?.limitations, ["Full-text validation required."]).slice(0, 4)
      };
    })
    .filter((item): item is ResearchFinding => Boolean(item));

  return findings.length ? findings : fallback;
}

function themesFromFindings(findings: ResearchFinding[], fallback: ResearchTheme[]): ResearchTheme[] {
  if (findings.length === 0) return fallback;

  return findings.slice(0, 5).map((finding) => ({
    id: finding.id,
    title: finding.title,
    headline: finding.title,
    summary: `${finding.takeaway} ${finding.explanation}`,
    supportingPaperIds: finding.supportingPaperIds,
    evidenceLevel: finding.evidenceLevel,
    methods: finding.supportingDetails.slice(0, 3),
    implications: [finding.whyItMatters],
    limitations: finding.limitations
  }));
}

function sanitizeExpertResponse(parsed: ExpertResponse, baseSynthesis: ResearchSynthesis, papers: Paper[]): ResearchSynthesis {
  const paperIds = new Set(papers.map((paper) => paper.id));
  const promptIdToPaperId = new Map(papers.map((paper, index) => [`P${index + 1}`, paper.id]));
  const findings = sanitizeFindings(parsed.findings, paperIds, promptIdToPaperId, baseSynthesis.findings);
  const paperInsights = sanitizePaperInsights(parsed.paperInsights, paperIds, promptIdToPaperId, baseSynthesis.paperInsights || []);

  return {
    topicPrimer: sanitizeTopicPrimer(parsed.topicPrimer, baseSynthesis.topicPrimer),
    executiveAnswer: asString(parsed.executiveAnswer, baseSynthesis.executiveAnswer),
    keyTakeaways: asStringArray(parsed.keyTakeaways, baseSynthesis.keyTakeaways).slice(0, 6),
    findings,
    themes: themesFromFindings(findings, baseSynthesis.themes),
    paperInsights,
    synthesisMode: "expert-agent",
    areasOfAgreement: asStringArray(parsed.areasOfAgreement, baseSynthesis.areasOfAgreement).slice(0, 5),
    uncertainties: asStringArray(parsed.uncertainties, baseSynthesis.uncertainties).slice(0, 6),
    researchGaps: asStringArray(parsed.researchGaps, baseSynthesis.researchGaps).slice(0, 6),
    nextSteps: asStringArray(parsed.nextSteps, baseSynthesis.nextSteps).slice(0, 6)
  };
}

async function callExpertModel(
  question: string,
  methodology: SearchMethodology,
  papers: Paper[],
  baseSynthesis: ResearchSynthesis,
  model: string
): Promise<ExpertResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), expertSynthesisTimeoutMs());

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You are EzResearch's expert academic research swarm. Return valid JSON only. Use only supplied paper IDs and never invent citations."
        },
        {
          role: "user",
          content: buildExpertPrompt(question, methodology, papers, baseSynthesis)
        }
      ],
      max_output_tokens: 1300,
      text: {
        format: {
          type: "json_object"
        }
      }
    })
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    const errorText = await response.text();
    throw new ExpertSynthesisApiError(`OpenAI expert synthesis failed (${response.status}): ${truncate(errorText, 180)}`, response.status);
  }

  const json = await response.json();
  const text = extractResponseText(json);
  if (!text) {
    throw new Error("OpenAI expert synthesis returned no parseable text.");
  }

  return parseExpertJson(text);
}

export async function enhanceSynthesisWithExpertAgents(
  question: string,
  methodology: SearchMethodology,
  papers: Paper[],
  baseSynthesis: ResearchSynthesis
): Promise<ExpertSynthesisResult> {
  if (!expertSynthesisEnabled() || papers.length === 0) {
    if (expertSynthesisRequired() && papers.length > 0) {
      throw new Error(expertUnavailableMessage());
    }

    return {
      synthesis: baseSynthesis,
      usedExpertModel: false,
      warning:
        process.env.EZRESEARCH_ENABLE_EXPERT_SYNTHESIS === "true" && !process.env.OPENAI_API_KEY
          ? "Expert synthesis is enabled but not configured, so deterministic synthesis was used."
          : undefined
    };
  }

  try {
    let expert: ExpertResponse | undefined;
    let lastError: Error | undefined;

    for (const model of candidateModels()) {
      try {
        expert = await callExpertModel(question, methodology, papers, baseSynthesis, model);
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Expert synthesis failed.");
        if (
          lastError.name === "AbortError" ||
          (lastError instanceof ExpertSynthesisApiError && [401, 403, 404].includes(lastError.status))
        ) {
          break;
        }
      }
    }

    if (!expert) {
      throw lastError || new Error("Expert synthesis failed.");
    }

    return {
      synthesis: sanitizeExpertResponse(expert, baseSynthesis, papers),
      usedExpertModel: true
    };
  } catch (error) {
    if (expertSynthesisRequired()) {
      if (error instanceof ExpertSynthesisApiError && [401, 403].includes(error.status)) {
        throw new Error("Expert research synthesis failed because the OpenAI API key was rejected. Create or configure a valid OPENAI_API_KEY.");
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Expert research synthesis timed out. Increase OPENAI_EXPERT_TIMEOUT_MS or try a smaller paper set.");
      }

      throw new Error(error instanceof Error ? error.message : expertUnavailableMessage());
    }

    return {
      synthesis: baseSynthesis,
      usedExpertModel: false,
      warning: expertFallbackWarning()
    };
  }
}
