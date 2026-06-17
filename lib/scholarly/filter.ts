import type { ExcludedPaper, Paper } from "@/lib/types/paper";

const EXCLUDED_TYPES = [/editorial/i, /letter/i, /comment/i, /news/i, /erratum/i, /protocol/i];

export function filterPapers(
  papers: Paper[],
  includePreprints: boolean
): {
  included: Paper[];
  excluded: ExcludedPaper[];
} {
  const included: Paper[] = [];
  const excluded: ExcludedPaper[] = [];

  for (const paper of papers) {
    const typeText = paper.publicationTypes.join(" ");

    if (!includePreprints && paper.isPreprint) {
      excluded.push({ paper, reason: "Excluded because metadata suggests a preprint or repository source." });
      continue;
    }

    if (EXCLUDED_TYPES.some((pattern) => pattern.test(typeText))) {
      excluded.push({ paper, reason: "Excluded because publication type is not primary/review evidence." });
      continue;
    }

    if (!paper.likelyPeerReviewed) {
      excluded.push({
        paper,
        reason: "Excluded because metadata does not strongly suggest a journal article or scholarly review."
      });
      continue;
    }

    included.push({
      ...paper,
      reasonIncluded: "Included as a likely peer-reviewed scholarly source based on publication/source metadata."
    });
  }

  return { included, excluded };
}
