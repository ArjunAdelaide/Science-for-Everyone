import { describe, expect, it } from "vitest";
import { polishDeckText, sanitizeDeckSlides, validateDeckSlides } from "@/lib/synthesis/deckQuality";
import type { DeckPreviewSlide, Paper } from "@/lib/types/paper";

function slide(overrides: Partial<DeckPreviewSlide> = {}): DeckPreviewSlide {
  return {
    id: "finding-1",
    eyebrow: "Finding",
    title: "This area is evolving",
    subtitle: "full-text analysis summary",
    bullets: ["This this proves the result.", "More research is needed.", "signficant methodolgy signal"],
    citations: ["paper:1", "paper:missing"],
    footnote: "full text analysis performed",
    ...overrides
  };
}

const papers: Paper[] = [
  {
    id: "paper:1",
    source: "openalex",
    title: "Biomedical evidence record",
    authors: ["A Researcher"],
    year: 2024,
    publicationTypes: ["journal article"]
  }
];

describe("deck quality sanitation", () => {
  it("proofreads repeated words, typo-prone phrases, and overconfident wording", () => {
    expect(polishDeckText("This this proves a signficant result from full-text analysis.")).toBe(
      "This suggests a significant result from abstract-and-metadata analysis."
    );
  });

  it("creates unique ids, bounded non-empty bullets, and safe footnotes", () => {
    const sanitized = sanitizeDeckSlides(
      [
        slide({ id: "finding-1" }),
        slide({ id: "finding-1", title: "", bullets: ["", "efficacyy improved improved"] })
      ],
      { papers }
    );

    expect(sanitized.map((item) => item.id)).toEqual(["finding-1", "finding-1-2"]);
    expect(sanitized.every((item) => item.title.length > 0)).toBe(true);
    expect(sanitized.every((item) => item.bullets.length > 0 && item.bullets.length <= 5)).toBe(true);
    expect(sanitized.map((item) => item.citations)).toEqual([["paper:1"], ["paper:1"]]);
    expect(sanitized.flatMap((item) => [item.subtitle, item.footnote, ...item.bullets]).join(" ")).not.toMatch(
      /full[- ]text analysis|more research is needed|this area is evolving|signficant|efficacyy/i
    );
  });

  it("labels mock fallback decks clearly", () => {
    const sanitized = sanitizeDeckSlides([slide()], { papers: [{ ...papers[0], source: "mock" }] });
    expect(sanitized[0].footnote).toContain("Demo data is being used");
  });

  it("validates final slide boundaries", () => {
    const sanitized = sanitizeDeckSlides([slide()], { papers });
    expect(validateDeckSlides(sanitized, papers)).toEqual([]);
  });
});
