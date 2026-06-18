"use client";

import type { Paper, ResearchResult } from "@/lib/types/paper";

function sourceLabel(paper: Paper): string {
  return [paper.year || "n.d.", paper.journal || paper.source, paper.doi ? `DOI ${paper.doi}` : "DOI unavailable"]
    .filter(Boolean)
    .join(" / ");
}

export function SourcesColumn({
  averageScore,
  papers,
  result
}: {
  averageScore: number;
  papers: Paper[];
  result: ResearchResult;
}) {
  return (
    <aside className="order-2 max-h-[70vh] overflow-hidden border border-stone-300 bg-white lg:sticky lg:top-5 lg:order-1 lg:h-[calc(100vh-40px)] lg:max-h-none">
      <div className="border-b border-stone-300 p-5">
        <p className="text-xs font-semibold uppercase text-signal">Sources</p>
        <h1 className="mt-2 text-xl font-semibold leading-6 text-ink">{result.question}</h1>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="border border-stone-200 bg-stone-50 p-3">
            <p className="text-stone-500">Papers</p>
            <p className="mt-1 text-lg font-semibold text-ink">{papers.length}</p>
          </div>
          <div className="border border-stone-200 bg-stone-50 p-3">
            <p className="text-stone-500">Avg score</p>
            <p className="mt-1 text-lg font-semibold text-ink">{averageScore}</p>
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-stone-600">
          {result.methodology.analysisDepth} evidence package from {result.methodology.sources.join(" and ")}. Claims are
          citation-grounded and metadata/abstract-limited.
        </p>
      </div>

      <div className="h-[calc(100%-190px)] overflow-y-auto p-3">
        {papers.map((paper, index) => (
          <article className="border-b border-stone-200 px-2 py-4 last:border-b-0" key={paper.id}>
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-semibold text-signal">{String(index + 1).padStart(2, "0")}</span>
              <span className="shrink-0 bg-stone-100 px-2 py-1 text-[11px] font-semibold text-stone-700">
                {paper.score?.finalScore ?? "n/a"}
              </span>
            </div>
            <h2 className="mt-2 text-sm font-semibold leading-5 text-ink">{paper.title}</h2>
            <p className="mt-2 text-[11px] leading-4 text-stone-600">{sourceLabel(paper)}</p>
            <p className="mt-2 text-xs leading-5 text-stone-700">{paper.reasonIncluded}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}
