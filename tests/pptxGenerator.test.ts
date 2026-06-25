import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { generateResearchDeckBuffer } from "@/lib/synthesis/pptxGenerator";
import type { ResearchResult } from "@/lib/types/paper";

describe("pptx generation", () => {
  it("exports the same final deck slide model used by browser preview", async () => {
    const result: ResearchResult = {
      question: "different metadata title",
      dataMode: "live",
      methodology: {
        generatedQueries: ["crispr delivery"],
        sources: ["OpenAlex"],
        dateRange: { startYear: 2021, endYear: 2026 },
        includePreprints: false,
        maxPapers: 1,
        analysisDepth: "abstract-only",
        notes: []
      },
      papers: [],
      excludedPapers: [],
      synthesis: {
        topicPrimer: { topic: "CRISPR delivery", overview: "", whyItMatters: "", currentFocus: [], keyTerms: [] },
        executiveAnswer: "",
        keyTakeaways: [],
        findings: [],
        themes: [],
        paperInsights: [],
        synthesisMode: "deterministic",
        areasOfAgreement: [],
        uncertainties: [],
        researchGaps: [],
        nextSteps: []
      },
      evidenceTable: [],
      briefMarkdown: "",
      deckOutlineMarkdown: "",
      deckSlides: [
        {
          id: "title",
          eyebrow: "Evidence deck",
          title: "Shared final slide model validates deck export",
          subtitle: "Browser preview and PPTX should read from this object",
          bullets: ["Evidence: This exact bullet comes from result.deckSlides."],
          citations: [],
          footnote: "Abstract-only analysis."
        }
      ],
      usedMockData: false,
      warnings: []
    };

    const buffer = await generateResearchDeckBuffer(result);
    const zip = await JSZip.loadAsync(buffer);
    const slideXml = await Promise.all(
      Object.keys(zip.files)
        .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
        .map((path) => zip.file(path)?.async("string"))
    );

    expect(slideXml.join(" ")).toContain("Shared final slide model validates deck export");
    expect(slideXml.join(" ")).toContain("This exact bullet comes from result.deckSlides.");
  });
});
