import type {
  Paper,
  PaperInsight,
  ResearchFinding,
  ResearchSynthesis,
  ResearchTheme,
  SearchMethodology,
  TopicPrimer
} from "@/lib/types/paper";

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

const DEFAULT_MODEL = "gpt-4.1";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const EXPERT_SYNTHESIS_TIMEOUT_MS = 35_000;

function expertSynthesisEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY) && process.env.EZRESEARCH_ENABLE_EXPERT_SYNTHESIS !== "false";
}

function modelName(): string {
  return process.env.OPENAI_RESEARCH_MODEL || DEFAULT_MODEL;
}

function expertFallbackWarning(): string {
  return "Expert synthesis was unavailable, so EzResearch used deterministic abstract-and-metadata synthesis. Citations and claims remain grounded in retrieved records.";
}

function candidateModels(): string[] {
  return Array.from(new Set([modelName(), "gpt-4.1", "gpt-4.1-mini", "gpt-5"].filter(Boolean)));
}

function truncate(text: string | undefined, maxLength: number): string {
  if (!text) return "";
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3).trim()}...`;
}

function paperForPrompt(paper: Paper, index: number) {
  return {
    index: index + 1,
    id: paper.id,
    title: paper.title,
    authors: paper.authors.slice(0, 8),
    journal: paper.journal || null,
    year: paper.year || null,
    doi: paper.doi || null,
    publicationTypes: paper.publicationTypes,
    citationCount: paper.citationCount || null,
    likelyPeerReviewed: paper.likelyPeerReviewed || false,
    abstract: truncate(paper.abstract, 1050),
    score: paper.score
      ? {
          finalScore: paper.score.finalScore,
          explanation: paper.score.explanation.slice(0, 4)
        }
      : null
  };
}

function buildExpertPrompt(question: string, methodology: SearchMethodology, papers: Paper[], baseSynthesis: ResearchSynthesis): string {
  const promptPapers = papers.slice(0, 8).map(paperForPrompt);

  return JSON.stringify(
    {
      task:
        "Act as a faculty-level biomedical/life-sciences research intelligence swarm. Produce a presentation-ready synthesis for an academic medical audience.",
      nonNegotiables: [
        "Use only the supplied paper records. Do not invent citations, journals, authors, DOIs, statistics, effect sizes, clinical claims, or findings.",
        "Every finding must cite supportingPaperIds that exist in the supplied papers.",
        "The output should teach an intelligent non-specialist what the topic is, why it matters, what recent papers appear to show, and what remains uncertain.",
        "Write like a publishable academic medical briefing: precise, explanatory, cautious, and useful for a presenter.",
        "Clearly preserve abstract-only limitations. If full-text methods/results are needed, say so.",
        "Prefer mechanistic explanation and study design interpretation over generic validity language.",
        "Avoid empty phrases such as 'more research is needed' unless you state exactly what needs validation.",
        "For each finding, include at least one method/design detail and one scientific result or mechanism detail when the abstract supports it."
      ],
      agentRoles: {
        domainScientist:
          "Infer mechanisms, methods, biological/clinical meaning, and caveats from the abstracts without overclaiming.",
        evidenceAuditor: "Keep every claim grounded in paper IDs and downgrade confidence when support is thin.",
        narrativeStrategist: "Build a presentation arc: topic primer, why it matters, findings, implications, unresolved questions.",
        deckWriter: "Write slide-ready titles and bullets that educate the audience, not just describe the pipeline."
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
          overview: "120-180 word plain-language primer grounded in abstracts",
          whyItMatters: "80-140 word explanation of scientific/clinical importance",
          currentFocus: ["3-5 concrete focus areas in the retrieved literature"],
          keyTerms: ["6-10 important terms from the records"]
        },
        executiveAnswer: "120-180 word answer-first synthesis with caveats",
        keyTakeaways: ["3-5 presenter-ready takeaways"],
        findings: [
          {
            id: "finding-1",
            title: "assertive but cautious slide title",
            takeaway: "main finding in 1-2 sentences",
            explanation: "how the evidence supports this finding, including the biological/scientific logic",
            whyItMatters: "why this finding matters scientifically or clinically",
            supportingDetails: [
              "2-4 concrete abstract-derived details; each should state a method, study design, result, mechanism, population/model, endpoint, or limitation"
            ],
            supportingPaperIds: ["paper ids only from supplied papers"],
            evidenceLevel: "Emerging | Moderate | Strong",
            limitations: ["specific limitation or validation need"]
          }
        ],
        paperInsights: [
          {
            paperId: "paper id only from supplied papers",
            roleInLiterature: "why this paper matters in the evidence base",
            studyDesignOrApproach: "abstract-derived design/approach/method",
            mainResult: "abstract-derived main result",
            mechanismOrExplanation: "mechanism or explanation if stated or clearly implied by abstract",
            limitations: "abstract-only/full-text caveat",
            presentableTakeaway: "how a presenter should use this paper"
          }
        ],
        areasOfAgreement: ["2-4 cross-paper agreement points"],
        uncertainties: ["3-5 unresolved questions/disagreements"],
        researchGaps: ["3-5 gaps a full review should investigate"],
        nextSteps: ["3-5 practical validation steps"]
      }
    },
    null,
    2
  );
}

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "topicPrimer",
    "executiveAnswer",
    "keyTakeaways",
    "findings",
    "paperInsights",
    "areasOfAgreement",
    "uncertainties",
    "researchGaps",
    "nextSteps"
  ],
  properties: {
    topicPrimer: {
      type: "object",
      additionalProperties: false,
      required: ["topic", "overview", "whyItMatters", "currentFocus", "keyTerms"],
      properties: {
        topic: { type: "string" },
        overview: { type: "string" },
        whyItMatters: { type: "string" },
        currentFocus: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
        keyTerms: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 12 }
      }
    },
    executiveAnswer: { type: "string" },
    keyTakeaways: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 },
    findings: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "title",
          "takeaway",
          "explanation",
          "whyItMatters",
          "supportingDetails",
          "supportingPaperIds",
          "evidenceLevel",
          "limitations"
        ],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          takeaway: { type: "string" },
          explanation: { type: "string" },
          whyItMatters: { type: "string" },
          supportingDetails: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
          supportingPaperIds: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
          evidenceLevel: { type: "string", enum: ["Emerging", "Moderate", "Strong"] },
          limitations: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 }
        }
      }
    },
    paperInsights: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "paperId",
          "roleInLiterature",
          "studyDesignOrApproach",
          "mainResult",
          "mechanismOrExplanation",
          "limitations",
          "presentableTakeaway"
        ],
        properties: {
          paperId: { type: "string" },
          roleInLiterature: { type: "string" },
          studyDesignOrApproach: { type: "string" },
          mainResult: { type: "string" },
          mechanismOrExplanation: { type: "string" },
          limitations: { type: "string" },
          presentableTakeaway: { type: "string" }
        }
      }
    },
    areasOfAgreement: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
    uncertainties: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 },
    researchGaps: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 },
    nextSteps: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 }
  }
} as const;

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

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown, fallback: string[] = []): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())
    : fallback;
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

function sanitizePaperInsights(value: unknown, paperIds: Set<string>, fallback: PaperInsight[]): PaperInsight[] {
  if (!Array.isArray(value)) return fallback;

  const insights = value
    .map((item) => (item && typeof item === "object" ? (item as Partial<PaperInsight>) : null))
    .filter((item): item is Partial<PaperInsight> => Boolean(item && typeof item.paperId === "string" && paperIds.has(item.paperId)))
    .map((item) => ({
      paperId: item.paperId || "",
      roleInLiterature: asString(item.roleInLiterature, "Role not specified by expert synthesis."),
      studyDesignOrApproach: asString(item.studyDesignOrApproach, "Approach not available from abstract metadata."),
      mainResult: asString(item.mainResult, "Main result not available from abstract metadata."),
      mechanismOrExplanation: asString(item.mechanismOrExplanation, "Mechanism not available from abstract metadata."),
      limitations: asString(item.limitations, "Full-text validation required."),
      presentableTakeaway: asString(item.presentableTakeaway, "Use as supporting source context.")
    }));

  return insights.length ? insights : fallback;
}

function sanitizeFindings(value: unknown, paperIds: Set<string>, fallback: ResearchFinding[]): ResearchFinding[] {
  if (!Array.isArray(value)) return fallback;

  const findings = value
    .map((item, index) => (item && typeof item === "object" ? ({ ...(item as Partial<ResearchFinding>), index }) : null))
    .filter(Boolean)
    .map((item) => {
      const supportingPaperIds = asStringArray(item?.supportingPaperIds).filter((id) => paperIds.has(id)).slice(0, 6);
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
  const findings = sanitizeFindings(parsed.findings, paperIds, baseSynthesis.findings);
  const paperInsights = sanitizePaperInsights(parsed.paperInsights, paperIds, baseSynthesis.paperInsights || []);

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
  const timeout = setTimeout(() => controller.abort(), EXPERT_SYNTHESIS_TIMEOUT_MS);

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
            "You are EzResearch's expert academic research swarm. You produce only source-grounded, citation-auditable, presentation-ready scholarly synthesis."
        },
        {
          role: "user",
          content: buildExpertPrompt(question, methodology, papers, baseSynthesis)
        }
      ],
      max_output_tokens: 3200,
      text: {
        format: {
          type: "json_schema",
          name: "ezresearch_expert_synthesis",
          schema: responseSchema,
          strict: true
        }
      }
    })
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI expert synthesis failed (${response.status}): ${truncate(errorText, 180)}`);
  }

  const json = await response.json();
  const text = extractResponseText(json);
  if (!text) {
    throw new Error("OpenAI expert synthesis returned no parseable text.");
  }

  return JSON.parse(text) as ExpertResponse;
}

export async function enhanceSynthesisWithExpertAgents(
  question: string,
  methodology: SearchMethodology,
  papers: Paper[],
  baseSynthesis: ResearchSynthesis
): Promise<ExpertSynthesisResult> {
  if (!expertSynthesisEnabled() || papers.length === 0) {
    return {
      synthesis: baseSynthesis,
      usedExpertModel: false,
      warning: !process.env.OPENAI_API_KEY ? "Expert synthesis is not configured, so deterministic synthesis was used." : undefined
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
        if (lastError.name === "AbortError") break;
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
    return {
      synthesis: baseSynthesis,
      usedExpertModel: false,
      warning: expertFallbackWarning()
    };
  }
}
