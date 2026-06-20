"use client";

import type { DeckDownload } from "@/components/research/types";
import type { DeckPreviewSlide, ResearchResult } from "@/lib/types/paper";

type DeckPreviewProps = {
  deckDownload: DeckDownload | null;
  downloadingDeck: boolean;
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

export function DeckPreview({ deckDownload, downloadingDeck, onDownload, result, slides }: DeckPreviewProps) {
  if (slides.length === 0) return null;

  return (
    <section className="relative min-h-screen bg-[#f7f3ea] px-3 py-6 sm:px-6 lg:px-10">
      <div className="fixed right-4 top-4 z-30 flex items-center gap-2">
        {deckDownload ? (
          <a
            aria-label={`Download ${deckDownload.fileName}`}
            className="grid h-9 w-9 place-items-center border border-ink/15 bg-white/80 text-ink shadow-sm backdrop-blur transition hover:border-ink hover:bg-white"
            download={deckDownload.fileName}
            href={deckDownload.url}
            title="Download generated deck"
          >
            <DownloadIcon busy={false} />
          </a>
        ) : null}
        <button
          aria-label={downloadingDeck ? "Building PowerPoint deck" : "Download PowerPoint deck"}
          className="grid h-9 w-9 place-items-center bg-ink text-white shadow-sm transition hover:bg-signal disabled:cursor-wait disabled:bg-stone-500"
          disabled={downloadingDeck || result.papers.length === 0}
          onClick={onDownload}
          title={downloadingDeck ? "Building deck" : "Download PPTX"}
          type="button"
        >
          <DownloadIcon busy={downloadingDeck} />
        </button>
      </div>

      <div className="mx-auto flex max-w-[1180px] flex-col gap-8">
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

              <div className="grid min-h-0 gap-[clamp(16px,2.5vw,34px)] py-[clamp(14px,2.3vw,30px)] md:grid-cols-[1.42fr_0.58fr]">
                <ul className="grid content-start gap-[clamp(8px,1.2vw,15px)] overflow-hidden">
                  {slide.bullets.slice(0, 6).map((bullet, bulletIndex) => {
                    const parsed = splitBullet(bullet);

                    return (
                    <li className="grid grid-cols-[12px_1fr] gap-3" key={`${slide.id}-${bulletIndex}`}>
                      <span className="mt-[0.72em] h-1.5 w-1.5 bg-saffron" />
                      <span className="text-[clamp(12px,1.18vw,16px)] leading-[1.45] text-stone-800">
                        {parsed.label ? <span className="mr-2 text-[0.72em] font-semibold uppercase tracking-[0.12em] text-stone-500">{parsed.label}</span> : null}
                        {parsed.body}
                      </span>
                    </li>
                    );
                  })}
                </ul>

                <aside className="min-h-0 overflow-hidden border-l border-stone-200 pl-[clamp(12px,1.8vw,22px)]">
                  <p className="text-[clamp(9px,0.8vw,11px)] font-semibold uppercase tracking-[0.16em] text-stone-500">Source support</p>
                  {slide.citations.length > 0 ? (
                    <ul className="mt-3 grid gap-2 text-[clamp(9px,0.88vw,12px)] leading-[1.35] text-stone-600">
                      {slide.citations.slice(0, 6).map((citation, citationIndex) => (
                        <li className="border-t border-stone-200 pt-2 first:border-t-0 first:pt-0" key={`${slide.id}-citation-${citationIndex}`}>{citation}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-[clamp(10px,0.9vw,12px)] leading-4 text-stone-500">Orientation slide. Evidence citations begin on finding slides.</p>
                  )}
                </aside>
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
