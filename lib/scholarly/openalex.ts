import type { Paper } from "@/lib/types/paper";
import { buildOpenAlexSearch } from "@/lib/scholarly/query";

type OpenAlexResponse = {
  results?: OpenAlexWork[];
};

type OpenAlexWork = {
  id: string;
  doi?: string | null;
  title?: string;
  display_name?: string;
  publication_year?: number;
  publication_date?: string;
  cited_by_count?: number;
  type?: string;
  type_crossref?: string;
  abstract_inverted_index?: Record<string, number[]>;
  authorships?: {
    author?: {
      display_name?: string;
    };
  }[];
  primary_location?: {
    source?: {
      display_name?: string;
      type?: string;
    } | null;
  } | null;
  locations?: {
    source?: {
      display_name?: string;
      type?: string;
    } | null;
  }[];
};

function reconstructAbstract(index?: Record<string, number[]>): string | undefined {
  if (!index) {
    return undefined;
  }

  const words: string[] = [];

  for (const [word, positions] of Object.entries(index)) {
    for (const position of positions) {
      words[position] = word;
    }
  }

  return words.filter(Boolean).join(" ");
}

function normalizeDoi(doi?: string | null): string | undefined {
  return doi?.replace(/^https?:\/\/doi.org\//i, "").trim() || undefined;
}

function cleanText(value?: string): string | undefined {
  return value?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function isLikelyPreprint(work: OpenAlexWork): boolean {
  const primarySourceType = work.primary_location?.source?.type || "";
  const primarySourceName = work.primary_location?.source?.display_name || "";
  const workTypeText = `${work.type || ""} ${work.type_crossref || ""}`;
  const primarySourceText = `${primarySourceType} ${primarySourceName}`;

  if (/journal/i.test(primarySourceType)) {
    return false;
  }

  return /preprint|posted-content/i.test(workTypeText) || /repository|bioRxiv|medRxiv|arxiv/i.test(primarySourceText);
}

function isLikelyJournal(work: OpenAlexWork): boolean {
  const sourceType = work.primary_location?.source?.type;
  return work.type === "article" || sourceType === "journal" || /journal-article/i.test(work.type_crossref || "");
}

export async function searchOpenAlex(
  question: string,
  startYear: number,
  endYear: number,
  maxPapers: number
): Promise<Paper[]> {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", buildOpenAlexSearch(question));
  url.searchParams.set("filter", `from_publication_date:${startYear}-01-01,to_publication_date:${endYear}-12-31,type:article`);
  url.searchParams.set("sort", "relevance_score:desc");
  url.searchParams.set("per-page", String(Math.min(maxPapers * 2, 100)));

  if (process.env.OPENALEX_MAILTO) {
    url.searchParams.set("mailto", process.env.OPENALEX_MAILTO);
  }

  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok) {
    throw new Error(`OpenAlex search failed: ${response.status}`);
  }

  const json = (await response.json()) as OpenAlexResponse;

  return (json.results || []).map((work) => ({
    id: `openalex:${work.id}`,
    source: "openalex",
    title: cleanText(work.title || work.display_name) || "Untitled OpenAlex work",
    authors:
      work.authorships
        ?.map((authorship) => authorship.author?.display_name)
        .filter((name): name is string => Boolean(name))
        .slice(0, 12) || [],
    journal: work.primary_location?.source?.display_name,
    year: work.publication_year,
    publicationDate: work.publication_date,
    doi: normalizeDoi(work.doi),
    url: work.doi || work.id,
    abstract: reconstructAbstract(work.abstract_inverted_index),
    publicationTypes: [work.type, work.type_crossref].filter((value): value is string => Boolean(value)),
    citationCount: work.cited_by_count,
    likelyPeerReviewed: isLikelyJournal(work),
    isPreprint: isLikelyPreprint(work)
  }));
}
