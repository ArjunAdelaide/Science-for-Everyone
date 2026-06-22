"use client";

import type { DeckDownload } from "@/components/research/types";
import type { DeckPreviewSlide, ResearchResult } from "@/lib/types/paper";

type DeckPreviewProps = {
  deckDownload: DeckDownload | null;
  downloadingDeck: boolean;
  error: string | null;
  onNewSearch: () => void;
  onDownload: () => void;
  result: ResearchResult;
  slides: DeckPreviewSlide[];
};

function splitBullet(bullet: string): { label?: string; body: string } {
  const match = bullet.match(/^([^:]{3,28}):\s(.+)$/);
  if (!match) return { body: bullet };
  return {
    label: match[1],
    body: match[2]
  };
}

function DownloadIcon({ busy }: { busy: boolean }) {
  if (busy) {
    return <span className="block h-3.5 w-3.5 animate-spin rounded-full border border-white/40 border-t-white" />;
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function DeckPreview({ deckDownload, downloadingDeck, error, onDownload, onNewSearch, result, slides }: DeckPreviewProps) {
  if (slides.length === 0) return null;
  const dataModeLabel =
    result.dataMode === "mock-fallback" ? "Demo data" : result.dataMode === "empty" ? "No live records" : "Live sources";
  const synthesisModeLabel = result.synthesis?.synthesisMode === "expert-agent" ? "Expert synthesis" : "Deterministic";
  const warning = error || result.warnings[0];

  return (
    <section className="relative min-h-screen bg-[#f7f3ea] px-3 pb-6 pt-16 sm:px-6 lg:px-10">
      <div className="fixed left-4 top-4 z-30 flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-2">
        <button
          className="inline-flex h-9 items-center border border-ink/15 bg-white/85 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink shadow-sm backdrop-blur transition hover:border-ink hover:bg-white"
          onClick={onNewSearch}
          type="button"
        >
          New search
        </button>
        <span className="hidden h-9 items-center border border-ink/10 bg-white/70 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-600 shadow-sm backdrop-blur sm:inline-flex">
          {dataModeLabel}
        </span>
        <span className="hidden h-9 items-center border border-ink/10 bg-white/70 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-600 shadow-sm backdrop-blur md:inline-flex">
          {synthesisModeLabel}
        </span>
      </div>
      <div className="fixed right-4 top-4 z-30 flex items-center gap-2">
        {deckDownload ? (
          <a
            aria-label={`Download ${deckDownload.fileName}`}
            className="inline-flex h-9 items-center gap-2 border border-ink/15 bg-white/85 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink shadow-sm backdrop-blur transition hover:border-ink hover:bg-white"
            download={deckDownload.fileName}
            href={deckDownload.url}
            title="Download generated deck"
          >
            <DownloadIcon busy={false} />
            PPTX ready
          </a>
        ) : (
          <button
            aria-label={downloadingDeck ? "Building PowerPoint deck" : "Download PowerPoint deck"}
            className="inline-flex h-9 items-center gap-2 bg-ink px-3 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-signal disabled:cursor-wait disabled:bg-stone-500"
            disabled={downloadingDeck || slides.length === 0}
            onClick={onDownload}
            title={downloadingDeck ? "Building deck" : "Download PPTX"}
            type="button"
          >
            <DownloadIcon busy={downloadingDeck} />
            {downloadingDeck ? "Building" : "Download PPTX"}
          </button>
        )}
      </div>

      <div className="mx-auto flex max-w-[1180px] flex-col gap-8">
        {warning ? (
          <div className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-950 shadow-sm">
            {warning}
          </div>
        ) : null}
        {slides.map((slide, index) => (
          <article className="deck-slide aspect-video overflow-hidden border border-stone-300 bg-white shadow-[0_18px_50px_rgba(17,24,39,0.08)]" key={slide.id}>
            <div className="grid h-full grid-rows-[auto_1fr_auto] p-[clamp(18px,3vw,38px)]">
              <div className="grid grid-cols-[1fr_auto] gap-6 border-b border-stone-200 pb-[clamp(12px,1.7vw,22px)]">
                <div className="min-w-0">
                  <p className="text-[clamp(9px,0.9vw,11px)] font-semibold uppercase tracking-[0.18em] text-signal">{slide.eyebrow}</p>
                  <h3 className="mt-2 max-w-[920px] text-[clamp(22px,3.2vw,42px)] font-semibold leading-[1.04] text-ink">{slide.title}</h3>
                  {slide.subtitle ? <p className="mt-3 max-w-[860px] text-[clamp(12px,1.2vw,16px)] leading-6 text-stone-600">{slide.subtitle}</p> : null}
                </div>
                <span className="shrink-0 text-[clamp(12px,1.2vw,16px)] font-semibold text-stone-400">{String(index + 1).padStart(2, "0")}</span>
              </div>

              <div className="min-h-0 py-[clamp(14px,2.3vw,28px)]">
                <ul className="grid content-start gap-[clamp(8px,1.1vw,14px)] overflow-hidden">
                  {slide.bullets.slice(0, 5).map((bullet, bulletIndex) => {
                    const parsed = splitBullet(bullet);

                    return (
                    <li className="grid grid-cols-[12px_1fr] gap-3" key={`${slide.id}-${bulletIndex}`}>
                      <span className="mt-[0.72em] h-1.5 w-1.5 bg-saffron" />
                      <span className="text-[clamp(12px,1.08vw,15px)] leading-[1.38] text-stone-800">
                        {parsed.label ? <span className="mr-2 text-[0.72em] font-semibold uppercase tracking-[0.12em] text-stone-500">{parsed.label}</span> : null}
                        {parsed.body}
                      </span>
                    </li>
                    );
                  })}
                </ul>
              </div>

              <p className="truncate border-t border-stone-200 pt-3 text-[clamp(9px,0.85vw,11px)] text-stone-500" title={slide.footnote || "Abstract-only analysis; verify against full text before high-stakes use."}>
                {slide.footnote || "Abstract-only analysis; verify against full text before high-stakes use."} · {result.synthesis?.synthesisMode === "expert-agent" ? "Expert-agent synthesis" : "Deterministic synthesis"} · {result.papers.length} sources
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
