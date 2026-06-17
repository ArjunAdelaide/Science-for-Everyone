"use client";

import type { ResearchResult } from "@/lib/types/paper";

type SummaryHeaderProps = {
  averageScore: number;
  result: ResearchResult | null;
};

export function SummaryHeader({ averageScore, result }: SummaryHeaderProps) {
  return (
    <section className="border-b border-stone-300 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-signal">EzResearch</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">Academic research intelligence</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-700 md:text-base">
            Evidence-grounded briefs and decks for biomedical literature. Built for transparent retrieval, scoring,
            citations, and auditability.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <MetricCard accent="border-signal" label="papers" value={result?.papers.length || 0} />
          <MetricCard accent="border-saffron" label="avg score" value={averageScore} />
          <MetricCard accent="border-moss" label="claims" value={result?.evidenceTable.length || 0} />
        </div>
      </div>
    </section>
  );
}

function MetricCard({ accent, label, value }: { accent: string; label: string; value: number }) {
  return (
    <div className={`border-l-4 ${accent} bg-stone-50 px-4 py-3`}>
      <div className="text-2xl font-semibold text-ink">{value}</div>
      <div className="text-xs text-stone-600">{label}</div>
    </div>
  );
}
