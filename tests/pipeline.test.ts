import { describe, expect, it } from "vitest";
import { scorePaper, rankPapers } from "@/lib/scoring/paperScore";
import { dedupePapers } from "@/lib/scholarly/dedupe";
import { filterPapers } from "@/lib/scholarly/filter";
import { buildEvidenceTable, generateBriefMarkdown } from "@/lib/synthesis/briefGenerator";
import { buildDeckPreviewSlides } from "@/lib/synthesis/deckPreview";
import { validateDeckSlides } from "@/lib/synthesis/deckQuality";
import { buildResearchSynthesis } from "@/lib/synthesis/researchSynthesis";
import type { Paper, ResearchRequest, ResearchTheme, SearchMethodology } from "@/lib/types/paper";

function paper(overrides: Partial<Paper>): Paper {
  return {
    id: overrides.id || "paper:1",
    source: overrides.source || "openalex",
    title: overrides.title || "CRISPR delivery with lipid nanoparticles",
    authors: overrides.authors || ["Ada Lovelace"],
    journal: overrides.journal || "Journal of Biomedical Research",
    year: overrides.year || 2024,
    doi: overrides.doi,
    abstract:
      overrides.abstract ||
      "CRISPR delivery using lipid nanoparticles improved transient editing while preserving dose control.",
    publicationTypes: overrides.publicationTypes || ["journal article"],
    citationCount: overrides.citationCount ?? 42,
    likelyPeerReviewed: overrides.likelyPeerReviewed ?? true,
    isPreprint: overrides.isPreprint ?? false
  };
}

describe("paper processing", () => {
  it("deduplicates by DOI and keeps richer metadata", () => {
    const papers = dedupePapers([
      paper({ id: "a", doi: "10.123/test", authors: ["A"] }),
      paper({ id: "b", doi: "10.123/test", authors: ["A", "B"], citationCount: 99 })
    ]);

    expect(papers).toHaveLength(1);
    expect(papers[0].authors).toEqual(["A", "B"]);
    expect(papers[0].citationCount).toBe(99);
  });

  it("filters likely preprints unless allowed", () => {
    const filtered = filterPapers([paper({ id: "preprint", isPreprint: true })], false);
    expect(filtered.included).toHaveLength(0);
    expect(filtered.excluded[0].reason).toContain("preprint");
  });

  it("scores relevant recent journal papers higher than weak matches", () => {
    const strong = scorePaper(paper({ title: "CRISPR delivery methods for therapeutic editing" }), "CRISPR delivery", 2021, 2026);
    const weak = scorePaper(
      paper({ title: "Protein folding atlas", abstract: "Unrelated structural biology study." }),
      "CRISPR delivery",
      2021,
      2026
    );

    expect(strong.finalScore).toBeGreaterThan(weak.finalScore);
    expect(strong.explanation[0]).toContain("Relevance");
  });

  it("builds evidence claims and a citation-grounded brief", () => {
    const ranked = rankPapers([paper({ id: "p1", doi: "10.123/test" })], "CRISPR delivery", 2021, 2026);
    const evidence = buildEvidenceTable(ranked);
    const request: ResearchRequest = {
      question: "CRISPR delivery",
      startYear: 2021,
      endYear: 2026,
      maxPapers: 5,
      includePreprints: false,
      outputType: "both"
    };
    const methodology: SearchMethodology = {
      generatedQueries: ["crispr delivery"],
      sources: ["OpenAlex"],
      dateRange: { startYear: 2021, endYear: 2026 },
      includePreprints: false,
      maxPapers: 5,
      analysisDepth: "abstract-only",
      notes: []
    };
    const brief = generateBriefMarkdown(request, methodology, ranked, evidence);

    expect(evidence[0].supportingPaperIds).toEqual(["p1"]);
    expect(brief).toContain("EzResearch Recent Findings Report");
    expect(brief).toContain("Recent Findings in the Selected Window");
    expect(brief).toContain("10.123/test");
  });

  it("drops unsupported paper ids from evidence claims", () => {
    const ranked = rankPapers([paper({ id: "p1", doi: "10.123/test" })], "CRISPR delivery", 2021, 2026);
    const themes: ResearchTheme[] = [
      {
        id: "theme-1",
        title: "Theme",
        headline: "LNP delivery is prominent",
        summary: "Theme summary",
        supportingPaperIds: ["p1", "invented-paper-id"],
        evidenceLevel: "Moderate",
        methods: ["abstract review"],
        implications: ["supports auditability"],
        limitations: ["abstract only"]
      }
    ];

    const evidence = buildEvidenceTable(ranked, themes);

    expect(evidence[0].supportingPaperIds).toEqual(["p1"]);
  });

  it("clusters ranked papers into explanatory synthesis themes", () => {
    const ranked = rankPapers(
      [
        paper({ id: "p1", title: "CRISPR delivery with lipid nanoparticles", abstract: "Lipid nanoparticle delivery improved editing efficiency in vivo." }),
        paper({ id: "p2", title: "Viral vector delivery for genome editing", abstract: "AAV vector delivery enabled therapeutic editing but raised dose and immune safety constraints." })
      ],
      "CRISPR delivery methods",
      2021,
      2026
    );
    const methodology: SearchMethodology = {
      generatedQueries: ["crispr delivery methods"],
      sources: ["OpenAlex"],
      dateRange: { startYear: 2021, endYear: 2026 },
      includePreprints: false,
      maxPapers: 5,
      analysisDepth: "abstract-only",
      notes: []
    };
    const synthesis = buildResearchSynthesis("CRISPR delivery methods", methodology, ranked);
    const evidence = buildEvidenceTable(ranked, synthesis.themes);
    const slides = buildDeckPreviewSlides("CRISPR delivery methods", methodology, ranked, evidence, synthesis);

    expect(synthesis.themes.length).toBeGreaterThan(0);
    expect(synthesis.topicPrimer.overview.toLowerCase()).toContain("crispr delivery");
    expect(synthesis.findings[0].takeaway).toContain("delivery");
    expect(slides.map((slide) => slide.id)).toEqual(expect.arrayContaining(["topic-primer", "finding-1", "evidence-and-limits"]));
    expect(new Set(slides.map((slide) => slide.id)).size).toBe(slides.length);
    expect(validateDeckSlides(slides, ranked)).toEqual([]);
    expect(slides.length).toBeLessThanOrEqual(7);
    expect(slides.map((slide) => slide.id)).not.toEqual(expect.arrayContaining(["source-map", "evidence-base", "references"]));
    expect(slides[0].bullets.join(" ")).not.toMatch(/presentation-ready|deck starts|following finding slides/i);
    expect(slides.find((slide) => slide.id === "finding-1")?.bullets.join(" ")).toMatch(/lipid|viral|editing|safety/i);
    expect(slides.every((slide) => slide.title.length > 0 && slide.bullets.length > 0 && slide.bullets.length <= 5)).toBe(true);
    expect(slides.flatMap((slide) => [slide.title, slide.subtitle, slide.footnote, ...slide.bullets]).join(" ")).not.toMatch(
      /full[- ]text analysis|more research is needed|this area is evolving/i
    );
    expect(slides.find((slide) => slide.id === "evidence-and-limits")?.bullets.join(" ")).toMatch(/source|limit|abstract/i);
    expect(slides[0].bullets.join(" ")).toMatch(/Main answer:/);
    expect(evidence[0].supportingPaperIds.length).toBeGreaterThan(1);
  });

  it("does not turn non-CRISPR topics into stopword or delivery decks", () => {
    const ranked = rankPapers(
      [
        paper({
          id: "a1",
          title: "AlphaFold protein structure prediction for variant interpretation",
          abstract:
            "AlphaFold models can support protein structure prediction and variant interpretation, but confidence scores and experimental validation remain important."
        }),
        paper({
          id: "a2",
          title: "Deep learning protein folding benchmarks and experimental validation",
          abstract:
            "Protein folding benchmarks show that deep learning methods help prioritise experiments, although membrane proteins and complexes still require careful validation."
        })
      ],
      "AlphaFold",
      2021,
      2026
    );
    const methodology: SearchMethodology = {
      generatedQueries: ["alphafold"],
      sources: ["OpenAlex"],
      dateRange: { startYear: 2021, endYear: 2026 },
      includePreprints: false,
      maxPapers: 5,
      analysisDepth: "abstract-only",
      notes: []
    };
    const synthesis = buildResearchSynthesis("AlphaFold", methodology, ranked);
    const evidence = buildEvidenceTable(ranked, synthesis.themes);
    const slides = buildDeckPreviewSlides("AlphaFold", methodology, ranked, evidence, synthesis);
    const deckText = slides.flatMap((slide) => [slide.title, ...slide.bullets]).join(" ");

    expect(deckText).not.toMatch(/\b(the|and|of),\s*(and|of)/i);
    expect(deckText).not.toMatch(/Delivery research|delivery systems problem|payload into target cells/i);
    expect(deckText).not.toContain("...");
    expect(deckText).toMatch(/protein|structure|AlphaFold|prediction|validation/i);
    expect(validateDeckSlides(slides, ranked)).toEqual([]);
  });
});
