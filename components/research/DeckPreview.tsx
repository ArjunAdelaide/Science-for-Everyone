"use client";

import type { DeckDownload } from "@/components/research/types";
import type { DeckPreviewSlide } from "@/lib/types/paper";

type DeckPreviewProps = {
  deckDownload: DeckDownload | null;
  downloadingDeck: boolean;
  onDownload: () => void;
  slides: DeckPreviewSlide[];
};

export function DeckPreview({ deckDownload, downloadingDeck, onDownload, slides }: DeckPreviewProps) {
  if (slides.length === 0) return null;

  return (
    <section className="border border-stone-300 bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-signal">Primary output</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">Deck preview</h2>
          <p className="mt-1 text-sm text-stone-700">
            Slide-by-slide preview generated from the same evidence model used for PowerPoint export.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className="w-fit bg-signal px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-stone-500"
            disabled={downloadingDeck}
            onClick={onDownload}
            type="button"
          >
            {downloadingDeck ? "Building deck..." : "Generate PPTX"}
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

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {slides.map((slide, index) => (
          <article className="aspect-video overflow-hidden border border-stone-300 bg-paper p-5 shadow-sm" key={slide.id}>
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-3 border-b border-stone-300 pb-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-signal">{slide.eyebrow}</p>
                  <h3 className="mt-1 text-lg font-semibold leading-6 text-ink">{slide.title}</h3>
                  {slide.subtitle ? <p className="mt-1 text-xs text-stone-600">{slide.subtitle}</p> : null}
                </div>
                <span className="shrink-0 text-xs font-semibold text-stone-500">{index + 1}</span>
              </div>

              <div className="grid min-h-0 flex-1 gap-4 py-3 md:grid-cols-[1.25fr_0.75fr]">
                <ul className="space-y-2 overflow-hidden text-xs leading-5 text-stone-800">
                  {slide.bullets.slice(0, 5).map((bullet) => (
                    <li className="flex gap-2" key={bullet}>
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-saffron" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <div className="overflow-hidden border-l border-stone-300 pl-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Citations</p>
                  {slide.citations.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-[10px] leading-4 text-stone-700">
                      {slide.citations.slice(0, 5).map((citation) => (
                        <li key={citation}>{citation}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-[10px] leading-4 text-stone-500">No citation required for this slide.</p>
                  )}
                </div>
              </div>

              <p className="border-t border-stone-300 pt-2 text-[10px] text-stone-500">
                {slide.footnote || "Abstract-only analysis; verify against full text before high-stakes use."}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
