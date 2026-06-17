"use client";

import type { DeckDownload } from "@/components/research/types";

type MarkdownOutputsProps = {
  briefMarkdown: string;
  deckDownload: DeckDownload | null;
  deckOutlineMarkdown: string;
  downloadingDeck: boolean;
  onDownloadDeck: () => void;
};

export function MarkdownOutputs({
  briefMarkdown,
  deckDownload,
  deckOutlineMarkdown,
  downloadingDeck,
  onDownloadDeck
}: MarkdownOutputsProps) {
  if (!briefMarkdown && !deckOutlineMarkdown) return null;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {briefMarkdown ? (
        <section className="border border-stone-300 bg-white p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-wide text-signal">Report</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">Research brief</h2>
          <pre className="mt-4 max-h-[640px] overflow-auto whitespace-pre-wrap bg-stone-950 p-4 text-xs leading-5 text-stone-50">
            {briefMarkdown}
          </pre>
        </section>
      ) : null}

      {deckOutlineMarkdown ? (
        <section className="border border-stone-300 bg-white p-5 shadow-panel">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-signal">Deck</p>
              <h2 className="mt-1 text-xl font-semibold text-ink">Outline</h2>
            </div>
            <button
              className="w-fit bg-signal px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-stone-500"
              disabled={downloadingDeck}
              onClick={onDownloadDeck}
              type="button"
            >
              {downloadingDeck ? "Building..." : "Download .pptx"}
            </button>
          </div>
          {deckDownload ? (
            <a
              className="mt-3 inline-flex w-fit border border-signal bg-white px-4 py-2 text-sm font-semibold text-signal transition hover:border-ink hover:text-ink"
              download={deckDownload.fileName}
              href={deckDownload.url}
            >
              Save generated deck
            </a>
          ) : null}
          <pre className="mt-4 max-h-[640px] overflow-auto whitespace-pre-wrap bg-stone-950 p-4 text-xs leading-5 text-stone-50">
            {deckOutlineMarkdown}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
