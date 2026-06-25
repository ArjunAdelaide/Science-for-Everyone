import type { DeckPreviewSlide, Paper } from "@/lib/types/paper";

export const MAX_DECK_BULLETS = 5;
export const MAX_DECK_TITLE_LENGTH = 118;
export const MAX_DECK_SUBTITLE_LENGTH = 150;
export const MAX_DECK_BULLET_LENGTH = 185;
export const MAX_DECK_FOOTNOTE_LENGTH = 180;

type SanitizeDeckOptions = {
  papers?: Paper[];
  isMockFallback?: boolean;
};

function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3).trim()}...`;
}

function sentenceCaseAfterColon(text: string): string {
  return text.replace(/(^|:\s+)([a-z])/g, (match, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);
}

export function polishDeckText(value: string | undefined, fallback = ""): string {
  const source = (value || fallback || "").trim();
  if (!source) return "";

  const polished = source
    .replace(/\s+/g, " ")
    .replace(/\b([\w'-]+)\s+\1\b/gi, "$1")
    .replace(/\bsignficant\b/gi, "significant")
    .replace(/\befficacyy\b/gi, "efficacy")
    .replace(/\bmethodolgy\b/gi, "methodology")
    .replace(/\bscintific\b/gi, "scientific")
    .replace(/\bmore research is needed\b/gi, "full-text validation should clarify the remaining uncertainty")
    .replace(/\bthis area is evolving\b/gi, "the retrieved abstracts show a changing evidence base")
    .replace(/\bit is important to note that\b/gi, "")
    .replace(/\bfull[-\s]?text analysis\b/gi, "abstract-and-metadata analysis")
    .replace(/\bfull[-\s]?text reviewed\b/gi, "abstract-and-metadata reviewed")
    .replace(/\bdemonstrates conclusively\b/gi, "suggests")
    .replace(/\bproves\b/gi, "suggests")
    .replace(/\bproved\b/gi, "suggested")
    .replace(/\bproven\b/gi, "supported")
    .replace(/\bguarantees\b/gi, "suggests")
    .replace(/\bwithout question\b/gi, "based on the retrieved abstracts")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/([.!?]){2,}/g, "$1")
    .trim();

  return sentenceCaseAfterColon(polished);
}

function normalizedKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function uniqueSlideId(baseId: string, usedIds: Set<string>): string {
  const cleaned = normalizedKey(baseId || "slide").replace(/\s+/g, "-") || "slide";
  let candidate = cleaned;
  let suffix = 2;

  while (usedIds.has(candidate)) {
    candidate = `${cleaned}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
}

function sanitizeBullets(bullets: string[] | undefined): string[] {
  const seen = new Set<string>();
  const cleaned = (bullets || [])
    .map((bullet) => truncate(polishDeckText(bullet), MAX_DECK_BULLET_LENGTH))
    .filter(Boolean)
    .filter((bullet) => {
      const key = normalizedKey(bullet);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_DECK_BULLETS);

  return cleaned.length
    ? cleaned
    : ["Evidence: Retrieved abstracts did not provide enough detail for a stronger source-backed claim."];
}

function sanitizeCitations(citations: string[] | undefined, papers?: Paper[]): string[] {
  const paperIds = new Set((papers || []).map((paper) => paper.id));
  const seen = new Set<string>();

  return (citations || [])
    .map((citation) => citation.trim())
    .filter(Boolean)
    .filter((citation) => {
      if (paperIds.size > 0 && /^paper:/.test(citation) && !paperIds.has(citation)) return false;
      const key = normalizedKey(citation);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function sanitizeDeckSlides(slides: DeckPreviewSlide[], options: SanitizeDeckOptions = {}): DeckPreviewSlide[] {
  const usedIds = new Set<string>();
  const isMockFallback = options.isMockFallback || options.papers?.some((paper) => paper.source === "mock") || false;

  return slides.map((slide, index) => {
    const footnote = polishDeckText(slide.footnote || "Abstract-only analysis; verify against full text before high-stakes use.");
    const mockNotice = "Demo data is being used; do not treat this as a live literature result.";
    const mergedFootnote =
      isMockFallback && index === 0 && !footnote.includes(mockNotice)
        ? `${footnote} ${mockNotice}`
        : footnote;

    return {
      id: uniqueSlideId(slide.id || `slide-${index + 1}`, usedIds),
      eyebrow: truncate(polishDeckText(slide.eyebrow, `Slide ${index + 1}`), 56),
      title: truncate(polishDeckText(slide.title, "Evidence-grounded research briefing"), MAX_DECK_TITLE_LENGTH),
      subtitle: slide.subtitle ? truncate(polishDeckText(slide.subtitle), MAX_DECK_SUBTITLE_LENGTH) : undefined,
      bullets: sanitizeBullets(slide.bullets),
      citations: sanitizeCitations(slide.citations, options.papers),
      footnote: truncate(mergedFootnote, MAX_DECK_FOOTNOTE_LENGTH)
    };
  });
}

export function validateDeckSlides(slides: DeckPreviewSlide[], papers: Paper[] = []): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const paperIds = new Set(papers.map((paper) => paper.id));

  slides.forEach((slide, index) => {
    if (!slide.id.trim()) errors.push(`Slide ${index + 1} has an empty id.`);
    if (ids.has(slide.id)) errors.push(`Slide id "${slide.id}" is duplicated.`);
    ids.add(slide.id);
    if (!slide.title.trim()) errors.push(`Slide ${slide.id || index + 1} has an empty title.`);
    if (slide.bullets.length === 0 || slide.bullets.some((bullet) => !bullet.trim())) {
      errors.push(`Slide ${slide.id || index + 1} has an empty bullet.`);
    }
    if (slide.bullets.length > MAX_DECK_BULLETS) errors.push(`Slide ${slide.id} has too many bullets.`);

    const searchableText = [slide.title, slide.subtitle, ...slide.bullets, slide.footnote].filter(Boolean).join(" ");
    if (/full[-\s]?text analysis/i.test(searchableText)) {
      errors.push(`Slide ${slide.id} claims full-text analysis.`);
    }
    if (/\b([\w'-]+)\s+\1\b/i.test(searchableText)) {
      errors.push(`Slide ${slide.id} contains repeated words.`);
    }
    if (/\b(presentation-ready|deck starts|following finding slides|more research is needed|this area is evolving)\b/i.test(searchableText)) {
      errors.push(`Slide ${slide.id} contains generic briefing filler.`);
    }
    slide.citations.forEach((citation) => {
      if (paperIds.size > 0 && /^paper:/.test(citation) && !paperIds.has(citation)) {
        errors.push(`Slide ${slide.id} references unsupported citation ${citation}.`);
      }
    });
  });

  return errors;
}

export function finalizeDeckSlides(slides: DeckPreviewSlide[], options: SanitizeDeckOptions = {}): DeckPreviewSlide[] {
  const sanitized = sanitizeDeckSlides(slides, options);
  const validationErrors = validateDeckSlides(sanitized, options.papers || []);
  if (validationErrors.length === 0) return sanitized;

  // The second pass is intentionally conservative: preserve evidence meaning, but
  // force display-safe fallbacks if a future slide generator bypasses a boundary.
  return sanitizeDeckSlides(
    sanitized.map((slide, index) => ({
      ...slide,
      id: slide.id || `slide-${index + 1}`,
      title: slide.title || "Evidence-grounded research briefing",
      bullets: slide.bullets.length
        ? slide.bullets
        : ["Evidence: Retrieved abstracts did not provide enough detail for a stronger source-backed claim."],
      footnote: slide.footnote || "Abstract-only analysis; verify against full text before high-stakes use."
    })),
    options
  );
}
