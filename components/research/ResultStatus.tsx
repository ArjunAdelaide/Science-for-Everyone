"use client";

import type { DeckDownload } from "@/components/research/types";
import type { ResearchResult } from "@/lib/types/paper";

type ResultStatusProps = {
  deckDownload: DeckDownload | null;
  downloadingDeck: boolean;
  onDownloadDeck: () => void;
  result: ResearchResult;
};

export function ResultStatus({ deckDownload, downloadingDeck, onDownloadDeck, result }: ResultStatusProps) {
  return (
    <section className="border border-stone-300 bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-signal">Research package</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">{result.question}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            {result.methodology.analysisDepth} analysis across {result.methodology.sources.join(" and ")}. Peer-review
            status is metadata-inferred and should be validated for high-stakes use.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
          <button
            className="w-fit bg-signal px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-stone-500"
            disabled={downloadingDeck || result.papers.length === 0}
            onClick={onDownloadDeck}
            type="button"
          >
            {downloadingDeck ? "Building deck..." : "Download PPTX"}
          </button>
          {deckDownload ? (
            <a
              className="w-fit border border-signal bg-white px-4 py-2 text-sm font-semibold text-signal transition hover:border-ink hover:text-ink"
              download={deckDownload.fileName}
              href={deckDownload.url}
            >
              Save generated deck
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <StatusPill label="Data mode" value={result.dataMode === "mock-fallback" ? "Demo fallback" : result.dataMode} />
        <StatusPill
          label="Preprints"
          value={result.methodology.includePreprints ? "Allowed when retrieved" : "Excluded by metadata signal"}
        />
        <StatusPill label="Date range" value={`${result.methodology.dateRange.startYear}-${result.methodology.dateRange.endYear}`} />
      </div>

      {result.warnings.length > 0 ? (
        <div className="mt-4 space-y-2 border border-amber-200 bg-amber-50 p-3">
          {result.warnings.map((warning) => (
            <p className="text-sm text-amber-900" key={warning}>
              {warning}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-stone-200 bg-stone-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
