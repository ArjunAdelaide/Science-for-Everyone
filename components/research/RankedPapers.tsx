"use client";

import type { Paper } from "@/lib/types/paper";

function scoreTone(score?: number): string {
  if (!score) return "bg-stone-100 text-stone-700";
  if (score >= 75) return "bg-emerald-100 text-emerald-900";
  if (score >= 55) return "bg-amber-100 text-amber-900";
  return "bg-stone-200 text-stone-800";
}

export function RankedPapers({ papers }: { papers: Paper[] }) {
  return (
    <section className="border border-stone-300 bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-signal">Evidence base</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">Ranked papers</h2>
        </div>
        <span className="bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{papers.length} analysed</span>
      </div>

      {papers.length === 0 ? (
        <p className="mt-4 border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
          No records passed the current filters. Try a broader topic, a wider date range, or allowing preprints.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {papers.map((paper) => (
            <article className="border border-stone-300 bg-stone-50 p-4" key={paper.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-base font-semibold leading-6 text-ink">{paper.title}</h3>
                  <p className="mt-1 text-sm text-stone-700">
                    {paper.year || "n.d."} · {paper.journal || "Unknown source"} · {paper.doi || "DOI unavailable"}
                  </p>
                </div>
                <span className={`w-fit px-3 py-1 text-sm font-semibold ${scoreTone(paper.score?.finalScore)}`}>
                  {paper.score?.finalScore ?? "n/a"}/100
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-800">
                {paper.abstract
                  ? `${paper.abstract.slice(0, 360)}${paper.abstract.length > 360 ? "..." : ""}`
                  : "No abstract available from retrieved metadata."}
              </p>
              <div className="mt-3 grid gap-2 text-xs text-stone-700 md:grid-cols-2">
                <p>
                  <span className="font-semibold text-ink">Why included:</span> {paper.reasonIncluded}
                </p>
                <p>
                  <span className="font-semibold text-ink">Evidence signal:</span>{" "}
                  {paper.publicationTypes.join(", ") || "metadata unavailable"}
                </p>
              </div>
              {paper.score ? (
                <div className="mt-3 grid gap-2 text-xs md:grid-cols-4">
                  <span className="bg-white p-2">Relevance {paper.score.relevanceScore}</span>
                  <span className="bg-white p-2">Recency {paper.score.recencyScore}</span>
                  <span className="bg-white p-2">Evidence {paper.score.evidenceScore}</span>
                  <span className="bg-white p-2">Citations {paper.score.citationScore}</span>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
