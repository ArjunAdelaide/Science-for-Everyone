import type { EvidenceClaim, Paper, ResearchRequest, ResearchSynthesis, SearchMethodology } from "@/lib/types/paper";

function compactPaper(paper?: Paper): string {
  if (!paper) {
    return "Evidence source to be selected";
  }

  return `${paper.title} (${paper.year || "n.d."}, ${paper.journal || "unknown source"})`;
}

export function generateDeckOutlineMarkdown(
  request: ResearchRequest,
  methodology: SearchMethodology,
  papers: Paper[],
  evidenceTable: EvidenceClaim[],
  synthesis?: ResearchSynthesis
): string {
  const topPapers = papers.slice(0, 5);
  const claims = evidenceTable.slice(0, 3);
  const themes = synthesis?.themes || [];
  const findings = synthesis?.findings || [];
  const primer = synthesis?.topicPrimer;

  return `# Slide Deck Outline: ${request.question}

## 1. Title Slide
- Presentation: ${request.question}
- Date range: ${methodology.dateRange.startYear}-${methodology.dateRange.endYear}
- Source base: ${papers.length} retrieved scholarly records

## 2. Topic Primer
- ${primer?.overview || "Introduce the topic using the highest-scoring retrieved papers."}
- Key terms: ${primer?.keyTerms.join(", ") || "terms unavailable from retrieved metadata"}

## 3. Why This Topic Matters
- ${primer?.whyItMatters || synthesis?.executiveAnswer || "Explain why the topic matters to the audience."}
- Current focus: ${(primer?.currentFocus || []).join(" ")}

## 4. Executive Answer
- ${synthesis?.executiveAnswer || "Summarise the strongest finding from the retrieved abstracts."}
- ${synthesis?.keyTakeaways.slice(0, 2).join("\n- ") || "Keep claims tied to source records."}

## 5. Key Finding 1
- ${findings[0]?.title || themes[0]?.headline || claims[0]?.claim || "No claim generated"}
- Finding: ${findings[0]?.takeaway || claims[0]?.explanation || "No evidence explanation generated"}
- Why it matters: ${findings[0]?.whyItMatters || themes[0]?.implications.join(" ") || "Validate the finding against full text before using it in a decision."}

## 6. Key Finding 2
- ${findings[1]?.title || themes[1]?.headline || claims[1]?.claim || "No second claim generated"}
- Finding: ${findings[1]?.takeaway || claims[1]?.explanation || "No evidence explanation generated"}
- Why it matters: ${findings[1]?.whyItMatters || themes[1]?.implications.join(" ") || "Clarify whether this pattern holds across methods and populations."}

## 7. Key Finding 3
- ${findings[2]?.title || themes[2]?.headline || claims[2]?.claim || "No third claim generated"}
- Finding: ${findings[2]?.takeaway || claims[2]?.explanation || "No evidence explanation generated"}
- Why it matters: ${findings[2]?.whyItMatters || themes[2]?.implications.join(" ") || "Treat the signal as directional until full-text validation is complete."}

## 8. Literature Map
${topPapers.map((paper) => `- ${compactPaper(paper)} - score ${paper.score?.finalScore ?? "n/a"}/100`).join("\n")}

## 9. Open Questions
${(synthesis?.uncertainties || [
  "Which findings persist after full-text review?",
  "Which methods, models, populations, or outcome measures explain disagreement?",
  "Are there major newer papers missing from PubMed/OpenAlex coverage?"
]).map((item) => `- ${item}`).join("\n")}

## 10. Methodology and References
- Sources: ${methodology.sources.join(", ")}
- Query strategy: ${methodology.generatedQueries.join("; ")}
- Inclusion rule: likely peer-reviewed journal literature${methodology.includePreprints ? ", with preprints allowed" : ", with likely preprints excluded"}
${papers.slice(0, 10).map((paper) => `- ${compactPaper(paper)}${paper.doi ? `, DOI: ${paper.doi}` : ""}`).join("\n")}
`;
}
