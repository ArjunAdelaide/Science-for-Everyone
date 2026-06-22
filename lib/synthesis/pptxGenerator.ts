import pptxgen from "pptxgenjs";
import type { DeckPreviewSlide, ResearchResult } from "@/lib/types/paper";

type Presentation = InstanceType<typeof pptxgen>;
type Slide = ReturnType<Presentation["addSlide"]>;

const COLORS = {
  ink: "111827",
  paper: "FFFFFF",
  soft: "F8FAFC",
  white: "FFFFFF",
  stone: "475569",
  line: "CBD5E1",
  signal: "0F766E",
  saffron: "C27A17"
};

function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3).trim()}...`;
}

function splitBullet(bullet: string): { label?: string; body: string } {
  const match = bullet.match(/^([^:]{3,32}):\s(.+)$/);
  if (!match) return { body: bullet };
  return {
    label: match[1],
    body: match[2]
  };
}

function addFooter(slide: Slide, page: number, footnote?: string) {
  slide.addText(footnote || "Abstract-only analysis; verify against full text before high-stakes use.", {
    x: 0.55,
    y: 7.03,
    w: 9.8,
    h: 0.22,
    fontSize: 7.5,
    color: COLORS.stone,
    margin: 0
  });
  slide.addText(String(page), {
    x: 12.05,
    y: 7.03,
    w: 0.6,
    h: 0.22,
    fontSize: 8,
    color: COLORS.stone,
    align: "right",
    margin: 0
  });
}

function addDeckTitleSlide(pptx: Presentation, preview: DeckPreviewSlide) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.ink };
  slide.addText("EzResearch", {
    x: 0.65,
    y: 0.55,
    w: 2.2,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: COLORS.saffron,
    margin: 0
  });
  slide.addText(truncate(preview.title, 140), {
    x: 0.65,
    y: 1.45,
    w: 11.5,
    h: 1.5,
    fontFace: "Aptos Display",
    fontSize: 30,
    bold: true,
    color: COLORS.white,
    fit: "shrink",
    margin: 0
  });
  slide.addText(preview.subtitle || "Evidence-grounded academic research intelligence", {
    x: 0.68,
    y: 3.35,
    w: 11.0,
    h: 0.35,
    fontSize: 13,
    color: "E7E5E4",
    margin: 0
  });
  slide.addText(preview.bullets.join("  |  "), {
    x: 0.68,
    y: 4.35,
    w: 10.8,
    h: 0.65,
    fontSize: 10.5,
    color: "E7E5E4",
    fit: "shrink",
    margin: 0
  });
  slide.addText(preview.footnote || "Abstract-only analysis with citation-grounded claims", {
    x: 0.68,
    y: 6.86,
    w: 8.2,
    h: 0.24,
    fontSize: 8.5,
    color: "D6D3D1",
    margin: 0
  });
}

function addPreviewSlide(pptx: Presentation, preview: DeckPreviewSlide, page: number) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.paper };

  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.12,
    fill: { color: COLORS.signal },
    line: { color: COLORS.signal, transparency: 100 }
  });
  slide.addText(preview.eyebrow.toUpperCase(), {
    x: 0.6,
    y: 0.38,
    w: 3.6,
    h: 0.24,
    fontSize: 8.5,
    bold: true,
    color: COLORS.signal,
    margin: 0
  });
  slide.addText(truncate(preview.title, 105), {
    x: 0.58,
    y: 0.72,
    w: 11.7,
    h: 0.88,
    fontFace: "Aptos Display",
    fontSize: 25,
    bold: true,
    color: COLORS.ink,
    fit: "shrink",
    margin: 0
  });
  if (preview.subtitle) {
    slide.addText(truncate(preview.subtitle, 125), {
      x: 0.6,
      y: 1.48,
      w: 11.3,
      h: 0.3,
      fontSize: 10,
      color: COLORS.stone,
      margin: 0
    });
  }
  slide.addShape("line", {
    x: 0.55,
    y: 1.9,
    w: 12.1,
    h: 0,
    line: { color: COLORS.line, width: 1 }
  });

  slide.addShape("rect", {
    x: 0.6,
    y: 2.12,
    w: 12.05,
    h: 4.35,
    fill: { color: COLORS.soft },
    line: { color: COLORS.line, width: 0.5 }
  });
  preview.bullets.slice(0, 5).forEach((bullet, index) => {
    const parsed = splitBullet(bullet);
    const labelPrefix = parsed.label ? `${parsed.label.toUpperCase()}  ` : "";

    slide.addText(`${labelPrefix}${truncate(parsed.body, 175)}`, {
      x: 0.88,
      y: 2.36 + index * 0.58,
      w: 11.45,
      h: 0.42,
      fontSize: parsed.label ? 10.9 : 11.2,
      color: COLORS.ink,
      fit: "shrink",
      margin: 0
    });
    slide.addShape("line", {
      x: 0.72,
      y: 2.45 + index * 0.58,
      w: 0.07,
      h: 0,
      line: { color: COLORS.saffron, width: 2.2 }
    });
  });

  addFooter(slide, page, preview.footnote);
}

export async function generateResearchDeckBuffer(result: ResearchResult): Promise<Buffer> {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "EzResearch";
  pptx.company = "EzResearch";
  pptx.subject = "Academic research intelligence brief";
  pptx.title = `EzResearch deck - ${result.question}`;
  pptx.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos"
  };

  const slides = result.deckSlides.length > 0 ? result.deckSlides : [];
  if (slides[0]) {
    addDeckTitleSlide(pptx, slides[0]);
  }
  slides.slice(1).forEach((slide, index) => addPreviewSlide(pptx, slide, index + 2));

  const output = await pptx.write({ outputType: "arraybuffer" });

  if (output instanceof ArrayBuffer) return Buffer.from(output);
  if (output instanceof Uint8Array) return Buffer.from(output);
  if (output instanceof Blob) return Buffer.from(await output.arrayBuffer());
  return Buffer.from(output, "binary");
}
