import type { Paper } from "@/lib/types/paper";
import { buildPubMedQuery } from "@/lib/scholarly/query";

type PubMedSearchResponse = {
  esearchresult?: {
    idlist?: string[];
  };
};

type PubMedSummaryResponse = {
  result?: Record<string, PubMedSummaryArticle | string[]>;
};

type PubMedSummaryArticle = {
  uid: string;
  title?: string;
  fulljournalname?: string;
  pubdate?: string;
  sortpubdate?: string;
  authors?: { name: string }[];
  articleids?: { idtype: string; value: string }[];
  pubtype?: string[];
};

type PubMedFetchArticle = {
  uid: string;
  abstract?: string;
};

const EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

function withNcbiParams(url: URL) {
  url.searchParams.set("retmode", "json");
  url.searchParams.set("tool", process.env.NCBI_TOOL || "EzResearch");

  if (process.env.NCBI_EMAIL) {
    url.searchParams.set("email", process.env.NCBI_EMAIL);
  }

  if (process.env.NCBI_API_KEY) {
    url.searchParams.set("api_key", process.env.NCBI_API_KEY);
  }
}

function getYear(pubdate?: string): number | undefined {
  const match = pubdate?.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : undefined;
}

function getDoi(article?: PubMedSummaryArticle): string | undefined {
  return article?.articleids?.find((id) => id.idtype.toLowerCase() === "doi")?.value;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseAbstracts(xml: string): PubMedFetchArticle[] {
  const articles = Array.from(xml.matchAll(/<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g));

  return articles.map((article) => {
    const block = article[1];
    const pmid = block.match(/<PMID[^>]*>(.*?)<\/PMID>/)?.[1] || crypto.randomUUID();
    const abstractParts = Array.from(block.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)).map(
      (match) => stripTags(match[1])
    );

    return {
      uid: pmid,
      abstract: abstractParts.join(" ")
    };
  });
}

async function searchPubMedIds(query: string, maxPapers: number): Promise<string[]> {
  const url = new URL(`${EUTILS_BASE}/esearch.fcgi`);
  withNcbiParams(url);
  url.searchParams.set("db", "pubmed");
  url.searchParams.set("term", query);
  url.searchParams.set("sort", "relevance");
  url.searchParams.set("retmax", String(Math.min(maxPapers * 2, 80)));

  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok) {
    throw new Error(`PubMed search failed: ${response.status}`);
  }

  const json = (await response.json()) as PubMedSearchResponse;
  return json.esearchresult?.idlist || [];
}

async function fetchPubMedSummaries(ids: string[]): Promise<PubMedSummaryArticle[]> {
  if (ids.length === 0) {
    return [];
  }

  const url = new URL(`${EUTILS_BASE}/esummary.fcgi`);
  withNcbiParams(url);
  url.searchParams.set("db", "pubmed");
  url.searchParams.set("id", ids.join(","));

  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok) {
    throw new Error(`PubMed summary failed: ${response.status}`);
  }

  const json = (await response.json()) as PubMedSummaryResponse;
  const result = json.result || {};

  return ids
    .map((id) => result[id])
    .filter((article): article is PubMedSummaryArticle => Boolean(article) && !Array.isArray(article));
}

async function fetchPubMedAbstracts(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) {
    return new Map();
  }

  const url = new URL(`${EUTILS_BASE}/efetch.fcgi`);
  url.searchParams.set("db", "pubmed");
  url.searchParams.set("id", ids.join(","));
  url.searchParams.set("retmode", "xml");
  url.searchParams.set("rettype", "abstract");
  url.searchParams.set("tool", process.env.NCBI_TOOL || "EzResearch");

  if (process.env.NCBI_EMAIL) {
    url.searchParams.set("email", process.env.NCBI_EMAIL);
  }

  if (process.env.NCBI_API_KEY) {
    url.searchParams.set("api_key", process.env.NCBI_API_KEY);
  }

  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok) {
    throw new Error(`PubMed fetch failed: ${response.status}`);
  }

  const xml = await response.text();
  return new Map(parseAbstracts(xml).map((article) => [article.uid, article.abstract || ""]));
}

export async function searchPubMed(
  question: string,
  startYear: number,
  endYear: number,
  maxPapers: number
): Promise<Paper[]> {
  const query = buildPubMedQuery(question, startYear, endYear);
  const ids = await searchPubMedIds(query, maxPapers);
  const [summaries, abstracts] = await Promise.all([fetchPubMedSummaries(ids), fetchPubMedAbstracts(ids)]);

  return summaries.map((article) => {
    const doi = getDoi(article);
    const publicationTypes = article.pubtype || [];
    const year = getYear(article.pubdate || article.sortpubdate);

    return {
      id: `pubmed:${article.uid}`,
      source: "pubmed",
      title: article.title?.replace(/\.$/, "") || "Untitled PubMed record",
      authors: article.authors?.map((author) => author.name).slice(0, 12) || [],
      journal: article.fulljournalname,
      year,
      publicationDate: article.sortpubdate || article.pubdate,
      doi,
      url: `https://pubmed.ncbi.nlm.nih.gov/${article.uid}/`,
      abstract: abstracts.get(article.uid),
      publicationTypes,
      likelyPeerReviewed: publicationTypes.some((type) => /journal article|review|meta-analysis/i.test(type)),
      isPreprint: publicationTypes.some((type) => /preprint/i.test(type))
    };
  });
}
