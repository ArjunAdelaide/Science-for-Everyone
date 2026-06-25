import type { Paper, ResearchFinding, ResearchSynthesis, ResearchTheme, SearchMethodology, TopicPrimer } from "@/lib/types/paper";
import { extractKeywords } from "@/lib/scholarly/query";

const THEME_DEFINITIONS = [
  {
    id: "methods-and-measurement",
    title: "Delivery platforms and experimental methods",
    presenterFrame: "Explain which platforms are being tested and what each one is trying to solve.",
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
    title: "Observed editing effects and performance signals",
    presenterFrame: "Translate the strongest observed effects into a clear evidence storyline.",
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
    title: "Safety, delivery constraints, and translation risk",
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
    title: "Therapeutic application and translational relevance",
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
  },
  {
    id: "conceptual-landscape",
    title: "Conceptual landscape",
    presenterFrame: "Define the intellectual terrain before moving into individual papers.",
    patterns: [
      /framework/i,
      /theory/i,
      /mechanism/i,
      /pathway/i,
      /concept/i,
      /classification/i,
      /taxonomy/i
    ]
  }
] as const;

const STOPWORDS = new Set([
  "about",
  "after",
  "also",
  "analysis",
  "and",
  "article",
  "as",
  "based",
  "between",
  "could",
  "data",
  "editing",
  "effect",
  "ensuremath",
  "for",
  "from",
  "have",
  "has",
  "in",
  "into",
  "its",
  "journal",
  "method",
  "methods",
  "mml",
  "mn",
  "mo",
  "mrow",
  "msub",
  "msup",
  "of",
  "paper",
  "papers",
  "publication",
  "research",
  "review",
  "result",
  "results",
  "study",
  "studies",
  "that",
  "the",
  "their",
  "these",
  "this",
  "to",
  "using",
  "we",
  "with",
  "were",
  "what",
  "when",
  "where",
  "which",
  "abstract",
  "available",
  "current",
  "field",
  "significant",
  "technology"
]);

const SCIENTIFIC_SIGNAL_TERMS = [
  "black hole",
  "black holes",
  "general relativity",
  "gravitational wave",
  "gravitational waves",
  "event horizon",
  "accretion disk",
  "galaxy",
  "quasar",
  "cosmology",
  "quantum physics",
  "quantum simulation",
  "quantum sensing",
  "quantum computing",
  "quantum cavity",
  "entanglement",
  "coherence",
  "qubit",
  "cavity",
  "alphafold",
  "protein structure",
  "structure prediction",
  "protein folding",
  "protein design",
  "protein-protein interaction",
  "deep learning",
  "machine learning",
  "foundation model",
  "large language model",
  "molecular dynamics",
  "drug discovery",
  "cryo-em",
  "sequence alignment",
  "benchmark",
  "nanomaterial",
  "lipid-based nanoparticle",
  "lipid nanoparticle",
  "polymeric nanoparticle",
  "polymeric nanoparticles",
  "lnp",
  "ribonucleoprotein",
  "rnp",
  "viral vector",
  "viral vectors",
  "aav",
  "lentiviral vector",
  "extracellular vesicle",
  "nanovesicle",
  "polymeric nanoparticle",
  "nanoparticle",
  "non-viral delivery",
  "in vivo",
  "ex vivo",
  "cas9",
  "guide rna",
  "base editing",
  "prime editing",
  "off-target",
  "immune response",
  "toxicity",
  "dose",
  "cargo",
  "liver",
  "lung",
  "genome editing",
  "genetic disease",
  "therapeutic genome editing",
  "clinical trial",
  "systematic review",
  "meta-analysis"
];

const THEME_SIGNAL_TERMS: Record<string, string[]> = {
  "methods-and-measurement": [
    "lipid nanoparticle",
    "lnp",
    "viral vector",
    "viral vectors",
    "aav",
    "extracellular vesicle",
    "nanovesicle",
    "polymeric nanoparticle",
    "ribonucleoprotein",
    "rnp",
    "non-viral delivery"
  ],
  "findings-and-effects": ["editing efficiency", "genome editing", "specificity", "potency", "in vivo", "low-toxicity", "scalable"],
  "constraints-and-risks": ["toxicity", "immune response", "off-target", "dose", "cargo", "delivery efficiency", "barrier"],
  "application-and-translation": ["therapeutic genome editing", "genetic disease", "in vivo", "ex vivo", "liver", "lung", "clinical trial"],
  "evidence-synthesis": ["systematic review", "meta-analysis", "review", "consensus", "landscape"]
};

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
  return strongestSentences(papers, queryKeywords, 1)[0] || "The retrieved papers provide directional abstract-level evidence.";
}

function strongestSentences(papers: Paper[], queryKeywords: string[], limit: number): string[] {
  const sentences = papers
    .flatMap((paper) => (paper.abstract || paper.keyFinding || paper.title).split(/(?<=[.!?])\s+/).map((sentence) => ({ sentence, paper })))
    .map(({ sentence, paper }) => {
      const lower = sentence.toLowerCase();
      const keywordHits = queryKeywords.filter((keyword) => lower.includes(keyword.toLowerCase())).length;
      const actionHits = /(improv|increase|decrease|reduce|show|demonstrat|suggest|enable|associate|identify)/i.test(sentence) ? 1 : 0;
      return { sentence: sentence.trim(), paper, score: keywordHits * 3 + actionHits + (paper.score?.finalScore || 0) / 100 };
    })
    .filter((item) => item.sentence.length > 32 && !isWeakAbstractSentence(item.sentence))
    .sort((a, b) => b.score - a.score);

  const unique: string[] = [];
  sentences.forEach(({ sentence }) => {
    const normalized = sentence.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (unique.some((existing) => existing.toLowerCase().replace(/[^a-z0-9]+/g, " ").includes(normalized.slice(0, 48)))) return;
    unique.push(sentence);
  });

  return unique.slice(0, limit);
}

function isWeakAbstractSentence(sentence: string): boolean {
  return /of paramount importance|rapid advancement|profound transformation|significant implications|nowadays|has instigated|emerging tool for genome/i.test(
    sentence
  );
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
  const matched = [...SCIENTIFIC_SIGNAL_TERMS, ...methodTerms].filter((term) => text.includes(term.toLowerCase()));
  const publicationTypes = papers.flatMap((paper) => paper.publicationTypes).filter(Boolean);
  return uniqueConcepts([...matched, ...publicationTypes]).slice(0, 4);
}

function scientificSignals(papers: Paper[], limit = 5): string[] {
  const text = papers.map(textForPaper).join(" ").toLowerCase();
  return SCIENTIFIC_SIGNAL_TERMS.filter((term) => text.includes(term.toLowerCase())).slice(0, limit);
}

function informativeMethod(paper: Paper): string {
  if (paper.method && !/^Publication type metadata:/i.test(paper.method)) {
    return paper.method;
  }

  return uniqueConcepts(scientificSignals([paper], 4)).join(", ") || "The abstract metadata does not specify a detailed experimental design.";
}

function paperTeachingTakeaway(paper: Paper, question: string): string {
  const signals = uniqueConcepts(scientificSignals([paper], 4));
  const usefulSentence = strongestSentences([paper], extractKeywords(question), 1)[0];
  const sourceType = paper.publicationTypes[0] || "scholarly record";

  if (signals.length) {
    return `${paper.year || "Recent"} ${sourceType} contributing evidence on ${formatConcepts(signals.slice(0, 3))}.`;
  }
  if (usefulSentence) {
    return truncate(usefulSentence, 150);
  }

  return `${paper.year || "Recent"} source ranked as relevant to the question; abstract detail is limited and needs full-text review.`;
}

function safePaperFinding(paper: Paper, question: string): string {
  return paperTeachingTakeaway(paper, question);
}

function themeSignals(themeId: string, papers: Paper[], question: string, limit = 4): string[] {
  const text = papers.map(textForPaper).join(" ").toLowerCase();
  const preferred = (THEME_SIGNAL_TERMS[themeId] || []).filter((term) => text.includes(term.toLowerCase()));
  return (preferred.length ? preferred : scientificSignals(papers, limit).concat(topConcepts(papers, question))).slice(0, limit);
}

function topConcepts(papers: Paper[], question: string): string[] {
  const queryWords = new Set(extractKeywords(question).map((keyword) => keyword.toLowerCase()));
  const counts = new Map<string, number>();

  papers
    .map(textForPaper)
    .join(" ")
    .toLowerCase()
    .match(/\b[a-z][a-z]+(?:-[a-z]+)?\b/g)
    ?.forEach((word) => {
      if (STOPWORDS.has(word) || queryWords.has(word) || word.endsWith("-")) return;
      counts.set(word, (counts.get(word) || 0) + 1);
    });

  return uniqueConcepts(
    Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
      .map(([word]) => word)
  );
}

function uniqueConcepts(concepts: string[]): string[] {
  const seen = new Set<string>();

  return concepts.filter((concept) => {
    const normalized = concept
      .toLowerCase()
      .replace(/\bvectors\b/g, "vector")
      .replace(/\bnanoparticles\b/g, "nanoparticle")
      .replace(/\s+/g, " ")
      .trim();
    if (!normalized || STOPWORDS.has(normalized) || normalized.length < 3 || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function corpusText(question: string, papers: Paper[]): string {
  return `${question} ${papers.map(textForPaper).join(" ")}`;
}

function topicKind(question: string, papers: Paper[]): "delivery" | "protein-ai" | "general-biomed" {
  const query = question.toLowerCase();
  const text = corpusText(question, papers);

  if (/crispr|cas9|gene editing|genome editing|delivery method|delivery methods|viral vector|lipid nanoparticle|aav|rnp/.test(query)) {
    return "delivery";
  }
  if (/crispr|cas9|gene editing|genome editing/i.test(text) && /delivery|vector|nanoparticle|carrier|aav|rnp/i.test(text)) {
    return "delivery";
  }
  if (/alphafold|protein structure|structure prediction|protein folding|protein design|deep learning|machine learning|foundation model/i.test(text)) {
    return "protein-ai";
  }
  return "general-biomed";
}

function formatConcepts(concepts: string[]): string {
  const cleaned = uniqueConcepts(concepts).map(displayConcept);
  if (cleaned.length === 0) return "the dominant concepts in the retrieved abstracts";
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;
  return `${cleaned.slice(0, -1).join(", ")}, and ${cleaned[cleaned.length - 1]}`;
}

function displayConcept(concept: string): string {
  const labels: Record<string, string> = {
    alphafold: "AlphaFold",
    crispr: "CRISPR",
    cas9: "Cas9",
    aav: "AAV",
    lnp: "LNP",
    rnp: "RNP",
    rna: "RNA",
    dna: "DNA",
    "cryo-em": "cryo-EM"
  };

  return labels[concept.toLowerCase()] || concept;
}

function topicLabel(question: string): string {
  const cleaned = question
    .replace(/\b(what|are|is|the|latest|recent|peer-reviewed|findings|on|about|from|between|and)\b/gi, " ")
    .replace(/\b(19|20)\d{2}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const keywords = extractKeywords(cleaned || question).slice(0, 5);
  return displayTopicLabel(keywords.length ? keywords.join(" ") : question.trim());
}

function displayTopicLabel(label: string): string {
  return label
    .split(/\s+/)
    .map((word) => displayConcept(word))
    .join(" ");
}

function buildTopicPrimer(question: string, papers: Paper[]): TopicPrimer {
  const topic = topicLabel(question);
  const concepts = topConcepts(papers, question).slice(0, 8);
  const signals = scientificSignals(papers, 6);
  const coreTerms = signals.length ? signals : concepts;
  const kind = topicKind(question, papers);
  const focus = concepts.length
    ? [
        `The retrieved literature repeatedly discusses ${formatConcepts(coreTerms.slice(0, 3))}.`,
        `The strongest records frame the topic through ${formatConcepts(coreTerms.slice(3, 6))}.`,
        "The report treats these recurring terms as a source-grounded map of the abstracts, not a complete field ontology."
      ]
    : [
        "The retrieved literature is sparse or metadata-light, so the report starts from the highest-scoring papers.",
        "The topic should be interpreted through the ranked source list until deeper full-text extraction is added."
      ];

  return {
    topic,
    overview: coreTerms.length
      ? overviewForTopic(kind, topic, coreTerms)
      : `${topic} is presented here through the retrieved abstracts and metadata. The evidence base is too thin for a broad primer, so the deck focuses on the highest-scoring records and their directly stated claims.`,
    whyItMatters: whyTopicMatters(kind),
    currentFocus: focus,
    keyTerms: uniqueConcepts([...signals, ...concepts]).slice(0, 8)
  };
}

function overviewForTopic(kind: ReturnType<typeof topicKind>, topic: string, coreTerms: string[]): string {
  if (kind === "delivery") {
    return `${topic} is best read as a delivery systems problem: payload, carrier, target tissue, and safety constraints all shape whether an experimental signal becomes useful.`;
  }
  if (kind === "protein-ai") {
    return `${topic} predicts 3D protein structure from sequence signals; treat outputs as structural hypotheses that need biological validation.`;
  }
  return `${topic} is best read through the strongest recurring concepts in the retrieved abstracts: ${formatConcepts(coreTerms.slice(0, 4))}. The report separates what the literature appears to say from what still needs full-text validation.`;
}

function whyTopicMatters(kind: ReturnType<typeof topicKind>): string {
  if (kind === "delivery") {
    return "This matters because delivery quality can decide whether a strong biological mechanism becomes a useful therapy, tool, or product.";
  }
  if (kind === "protein-ai") {
    return "This matters because better structure prediction can change how researchers reason about protein function, variant effects, drug targets, and experimental design.";
  }
  return "This matters because the literature is moving faster than most readers can track manually; a useful presentation needs to compress the field into clear concepts, findings, and unresolved questions.";
}

function papersForTheme(papers: Paper[], patterns: readonly RegExp[]): Paper[] {
  return papers.filter((paper) => patterns.some((pattern) => pattern.test(textForPaper(paper)))).slice(0, 5);
}

function strongestSentenceForTheme(papers: Paper[], queryKeywords: string[], patterns: readonly RegExp[]): string {
  const sentences = papers
    .flatMap((paper) => (paper.abstract || paper.keyFinding || paper.title).split(/(?<=[.!?])\s+/).map((sentence) => ({ sentence, paper })))
    .map(({ sentence, paper }) => {
      const lower = sentence.toLowerCase();
      const keywordHits = queryKeywords.filter((keyword) => lower.includes(keyword.toLowerCase())).length;
      const patternHits = patterns.filter((pattern) => pattern.test(sentence)).length;
      const actionHits = /(improv|increase|decrease|reduce|show|demonstrat|suggest|enable|associate|identify|challenge|limit|toxicity|safety|immune)/i.test(sentence)
        ? 1
        : 0;
      return { sentence: sentence.trim(), score: patternHits * 5 + keywordHits * 2 + actionHits + (paper.score?.finalScore || 0) / 100 };
    })
    .filter((item) => item.sentence.length > 32 && !isWeakAbstractSentence(item.sentence))
    .sort((a, b) => b.score - a.score);

  return sentences[0]?.sentence || strongestSentence(papers, queryKeywords);
}

function fallbackConcepts(question: string, papers: Paper[]): string[] {
  const keywords = extractKeywords(question).filter((keyword) => !STOPWORDS.has(keyword.toLowerCase()));
  return uniqueConcepts([...scientificSignals(papers, 4), ...topConcepts(papers, question), ...keywords]).slice(0, 4);
}

function teachingTakeawayForTheme(themeId: string, concepts: string[], sourceCount: number, kind: ReturnType<typeof topicKind>): string {
  const conceptPhrase = formatConcepts(concepts.slice(0, 3));
  const sourceText = `${sourceCount} retrieved source${sourceCount === 1 ? "" : "s"}`;

  if (kind === "protein-ai") {
    if (themeId === "methods-and-measurement") {
      return `Evidence clusters around ${conceptPhrase}. Use predictions to guide experiments, not as final proof.`;
    }
    if (themeId === "findings-and-effects") {
      return `The useful signal is ${conceptPhrase}. Predictions can speed hypothesis generation, but experiments still decide truth.`;
    }
    if (themeId === "constraints-and-risks") {
      return `Main caution: ${conceptPhrase}. Confidence scores and biological context decide how much to trust the model.`;
    }
    return `Across ${sourceText}, the signal is ${conceptPhrase}; use it to see where protein-structure AI helps and where experiments still matter.`;
  }

  if (kind === "delivery") {
    if (themeId === "methods-and-measurement") {
      return `Evidence clusters around ${conceptPhrase}. The question is which delivery method moves payload into target cells safely and controllably.`;
    }
    if (themeId === "findings-and-effects") {
      return `The clearest performance signal is ${conceptPhrase}. Treat outcomes as delivery-dependent, not universal across every method or model.`;
    }
    if (themeId === "constraints-and-risks") {
      return `The main bottleneck is ${conceptPhrase}. These constraints decide whether an abstract-level signal can become decision-grade evidence.`;
    }
    if (themeId === "application-and-translation") {
      return `The translational story centres on ${conceptPhrase}. The key test is whether it works in the biological setting that matters.`;
    }
  }
  if (themeId === "methods-and-measurement") {
    return `Evidence clusters around ${conceptPhrase}. The key question is which methods, models, or measurements make the finding reliable.`;
  }
  if (themeId === "findings-and-effects") {
    return `The clearest signal is ${conceptPhrase}. Treat it as context-dependent until methods and outcomes are validated.`;
  }
  if (themeId === "constraints-and-risks") {
    return `The main uncertainty is ${conceptPhrase}. These limits decide how far the abstract-level finding can be trusted.`;
  }
  if (themeId === "application-and-translation") {
    return `The application story centres on ${conceptPhrase}. The key test is whether the finding holds in the setting that matters.`;
  }
  if (themeId === "evidence-synthesis") {
    return `Review-level records separate field patterns from isolated studies, but conclusions depend on how ${conceptPhrase} are defined.`;
  }

  return `Across ${sourceText}, the teaching signal is ${conceptPhrase}; treat it as an abstract-level map, not a final verdict.`;
}

function whyItMattersForTheme(themeId: string, concepts: string[], kind: ReturnType<typeof topicKind>): string {
  const conceptPhrase = formatConcepts(concepts.slice(0, 3));

  if (kind === "protein-ai") {
    if (themeId === "methods-and-measurement") {
      return "Methods matter because model architecture, training data, confidence scoring, and benchmark design shape whether predictions are useful for real biology.";
    }
    if (themeId === "findings-and-effects") {
      return "Performance matters because accurate structures can redirect experiments, but misleading predictions can waste validation effort.";
    }
    return `This matters because ${conceptPhrase} determines whether protein-structure AI is used as a decision aid, a hypothesis generator, or a result requiring confirmation.`;
  }

  if (kind === "delivery") {
    if (themeId === "methods-and-measurement") {
      return `Methods matter because changing the delivery vehicle can change biodistribution, cargo capacity, durability, and safety, even when the editing system is nominally the same.`;
    }
    if (themeId === "findings-and-effects") {
      return `Performance matters because editing efficiency, specificity, and biological context decide whether a result is scientifically interesting or practically usable.`;
    }
    if (themeId === "constraints-and-risks") {
      return `Risk matters because dose, toxicity, immune response, and off-target concerns can erase the value of otherwise strong editing activity.`;
    }
    if (themeId === "application-and-translation") {
      return `Translation matters because the same platform can look different across tissues, diseases, model systems, and clinical use cases.`;
    }
  }
  if (themeId === "methods-and-measurement") {
    return `Methods matter because the same topic can look different when authors use different models, measurements, assumptions, or endpoints.`;
  }
  if (themeId === "findings-and-effects") {
    return `Reported effects matter only when the methods and comparison points are clear enough to interpret.`;
  }
  if (themeId === "constraints-and-risks") {
    return `Uncertainty matters because abstract-level signals can weaken after full-text methods, limitations, and negative results are reviewed.`;
  }
  if (themeId === "application-and-translation") {
    return `Application matters because a finding is only useful if it transfers to the practical setting the reader cares about.`;
  }

  return `This matters because ${conceptPhrase} helps explain why the retrieved papers may agree on the topic but differ in usefulness for decisions.`;
}

function buildTheme(
  definition: { id: string; title: string; presenterFrame?: string; patterns: readonly RegExp[] },
  papers: Paper[],
  question: string
): ResearchTheme {
  const queryKeywords = extractKeywords(question);
  const signals = scientificSignals(papers, 4);
  const concepts = signals.length ? signals : topConcepts(papers, question);
  const leadSentence = strongestSentenceForTheme(papers, queryKeywords, definition.patterns);
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

function findingTitleForTheme(theme: ResearchTheme, papers: Paper[], question: string): string {
  const kind = topicKind(question, papers);
  const signals = themeSignals(theme.id, papers, question, 3);
  const concepts = (signals.length ? signals : fallbackConcepts(question, papers)).slice(0, 3);
  const conceptPhrase = formatConcepts(concepts);

  if (kind === "protein-ai") {
    if (theme.id === "methods-and-measurement") {
      return `AlphaFold evidence centres on ${conceptPhrase}`;
    }
    if (theme.id === "findings-and-effects") {
      return `Protein-structure predictions are most useful around ${conceptPhrase}`;
    }
    if (theme.id === "constraints-and-risks") {
      return `Confidence and validation limit how far ${conceptPhrase} can travel`;
    }
    return `The literature frames protein AI through ${conceptPhrase}`;
  }

  if (kind === "general-biomed") {
    if (theme.id === "methods-and-measurement") {
      return `Methods and evidence quality centre on ${conceptPhrase}`;
    }
    if (theme.id === "findings-and-effects") {
      return `The strongest reported signals cluster around ${conceptPhrase}`;
    }
    if (theme.id === "constraints-and-risks") {
      return `Interpretation is constrained by ${conceptPhrase}`;
    }
    return `The literature frames the topic through ${conceptPhrase}`;
  }

  if (theme.id === "methods-and-measurement") {
    return `Delivery research is concentrating on ${conceptPhrase}`;
  }
  if (theme.id === "findings-and-effects") {
    return `Reported editing effects cluster around ${conceptPhrase}`;
  }
  if (theme.id === "constraints-and-risks") {
    return `Translation is constrained by ${conceptPhrase}`;
  }
  if (theme.id === "application-and-translation") {
    return `Therapeutic translation depends on ${conceptPhrase}`;
  }
  if (theme.id === "evidence-synthesis") {
    return `Review evidence is organising the field around ${conceptPhrase}`;
  }
  return `The literature frames the topic through ${conceptPhrase}`;
}

function buildFindingsFromThemes(question: string, themes: ResearchTheme[], papers: Paper[]): ResearchFinding[] {
  const queryKeywords = extractKeywords(question);

  return themes.slice(0, 5).map((theme, index) => {
    const supportingPapers = theme.supportingPaperIds
      .map((id) => papers.find((paper) => paper.id === id))
      .filter((paper): paper is Paper => Boolean(paper));
    const details = strongestSentences(supportingPapers, queryKeywords, 3);
    const kind = topicKind(question, supportingPapers.length ? supportingPapers : papers);
    const signals = themeSignals(theme.id, supportingPapers, question, 4);
    const concepts = (signals.length ? signals : fallbackConcepts(question, supportingPapers)).slice(0, 4);
    const methodDetails = commonMethods(supportingPapers)
      .filter((method) => !/^journal article$/i.test(method))
      .slice(0, 2)
      .map((method) => `Method signal: ${method}`);
    const conceptDetail = concepts.length ? [`Scientific signal: ${formatConcepts(concepts.slice(0, 3))}.`] : [];
    const supportingDetails = Array.from(new Set([...methodDetails, ...conceptDetail, ...details.slice(0, 2)])).slice(0, 4);

    return {
      id: `finding-${index + 1}`,
      title: findingTitleForTheme(theme, supportingPapers, question),
      takeaway: truncate(teachingTakeawayForTheme(theme.id, concepts, supportingPapers.length, kind), 240),
      explanation: concepts.length
        ? `Across ${supportingPapers.length} retrieved source${supportingPapers.length === 1 ? "" : "s"}, this finding is connected to ${formatConcepts(concepts)}.`
        : `Across ${supportingPapers.length} retrieved source${supportingPapers.length === 1 ? "" : "s"}, this finding is visible in the highest-scoring abstracts.`,
      whyItMatters: whyItMattersForTheme(theme.id, concepts, kind),
      supportingDetails,
      supportingPaperIds: theme.supportingPaperIds,
      evidenceLevel: theme.evidenceLevel,
      limitations: theme.limitations
    };
  });
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
      topicPrimer: {
        topic: topicLabel(question),
        overview: "No papers passed the current retrieval and filtering pipeline, so EzResearch cannot generate a source-grounded topic primer.",
        whyItMatters: "The deck needs retrieved scholarly records before it can teach the topic responsibly.",
        currentFocus: [],
        keyTerms: []
      },
      executiveAnswer: "No papers passed the current retrieval and filtering pipeline, so no evidence-grounded synthesis can be produced.",
      keyTakeaways: ["Broaden the query, expand the date range, or allow preprints if appropriate."],
      findings: [],
      themes: [],
      paperInsights: [],
      synthesisMode: "deterministic",
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
  const findings = buildFindingsFromThemes(question, finalThemes, papers);
  const topicPrimer = buildTopicPrimer(question, papers);
  const topConceptList = Array.from(new Set([...scientificSignals(papers, 5), ...topConcepts(papers, question)])).slice(0, 5);
  const topFinding = findings[0];

  return {
    topicPrimer,
    executiveAnswer: topFinding
      ? `${topFinding.takeaway} Overall, the retrieved evidence should be treated as ${methodology.analysisDepth} research triage rather than a full systematic review.`
      : "The retrieved evidence is relevant, but the current records do not form a strong theme without full-text review.",
    keyTakeaways: [
      `${topicPrimer.topic} is the focus of this evidence-grounded presentation.`,
      topFinding ? `${topFinding.title}.` : "The evidence base is too thin for a strong storyline.",
      topConceptList.length ? `Recurring concepts include ${topConceptList.slice(0, 5).join(", ")}.` : "Recurring concepts were limited in metadata/abstract text."
    ],
    findings,
    themes: finalThemes,
    paperInsights: papers.slice(0, 10).map((paper) => ({
      paperId: paper.id,
      roleInLiterature: paper.publicationTypes.join(", ") || "Retrieved scholarly record",
      studyDesignOrApproach: informativeMethod(paper),
      mainResult: safePaperFinding(paper, question),
      mechanismOrExplanation: scientificSignals([paper], 4).length
        ? `Abstract signal includes ${formatConcepts(scientificSignals([paper], 4))}.`
        : "Mechanism or explanation not available from abstract metadata.",
      limitations: paper.limitation || "Full-text review is required to confirm methods, endpoints, and caveats.",
      presentableTakeaway: safePaperFinding(paper, question)
    })),
    synthesisMode: "deterministic",
    areasOfAgreement: findings.slice(0, 3).map((finding) => `${finding.title}: ${finding.takeaway}`),
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
