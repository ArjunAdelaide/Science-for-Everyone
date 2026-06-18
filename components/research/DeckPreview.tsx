"use client";

import type { DeckDownload } from "@/components/research/types";
import type { DeckPreviewSlide, ResearchResult } from "@/lib/types/paper";

type DeckPreviewProps = {
  deckDownload: DeckDownload | null;
  downloadingDeck: boolean;
  onDownload: () => void;
  question: string;
  result: ResearchResult;
  slides: DeckPreviewSlide[];
};

export function DeckPreview({ deckDownload, downloadingDeck, onDownload, question, result, slides }: DeckPreviewProps) {
  if (slides.length === 0) return null;

  return (
    <section className="min-h-[calc(100vh-40px)] border border-stone-300 bg-[#fbfaf7]">
      <div className="sticky top-0 z-10 border-b border-stone-300 bg-[#fbfaf7]/95 px-5 py-4 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-signal">Presentation deck</p>
            <h2 className="mt-1 text-2xl font-semibold leading-8 text-ink">{question}</h2>
            <p className="mt-1 text-sm text-stone-600">
              {slides.length} slides / {result.papers.length} sources / abstract-only, citation-grounded synthesis
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-signal disabled:cursor-not-allowed disabled:bg-stone-500"
              disabled={downloadingDeck || result.papers.length === 0}
              onClick={onDownload}
              type="button"
            >
              {downloadingDeck ? "Building PPTX..." : "Download PPTX"}
            </button>
            {deckDownload ? (
              <a
                className="border border-ink bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-signal hover:text-signal"
                download={deckDownload.fileName}
                href={deckDownload.url}
              >
                Save generated deck
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-7 p-5 2xl:grid-cols-2">
        {slides.map((slide, index) => (
          <article className="deck-slide aspect-video overflow-hidden border border-stone-300 bg-white shadow-sm" key={slide.id}>
            <div className="flex h-full flex-col p-6">
              <div className="flex items-start justify-between gap-5 border-b border-stone-200 pb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-signal">{slide.eyebrow}</p>
                  <h3 className="mt-2 text-[clamp(20px,2.1vw,30px)] font-semibold leading-tight text-ink">{slide.title}</h3>
                  {slide.subtitle ? <p className="mt-2 text-sm leading-5 text-stone-600">{slide.subtitle}</p> : null}
                </div>
                <span className="shrink-0 text-sm font-semibold text-stone-400">{String(index + 1).padStart(2, "0")}</span>
              </div>

              <div className="grid min-h-0 flex-1 gap-5 py-5 md:grid-cols-[1.35fr_0.65fr]">
                <ul className="space-y-3 overflow-hidden text-[clamp(12px,1vw,15px)] leading-6 text-stone-800">
                  {slide.bullets.slice(0, 6).map((bullet) => (
                    <li className="grid grid-cols-[14px_1fr] gap-3" key={bullet}>
                      <span className="mt-2 h-1.5 w-1.5 bg-saffron" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                <div className="overflow-hidden border-l border-stone-200 pl-4">
                  <p className="text-[10px] font-semibold uppercase text-stone-500">Source support</p>
                  {slide.citations.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-[11px] leading-4 text-stone-600">
                      {slide.citations.slice(0, 6).map((citation) => (
                        <li key={citation}>{citation}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-[11px] leading-4 text-stone-500">Orientation slide; citations begin on evidence slides.</p>
                  )}
                </div>
              </div>

              <p className="border-t border-stone-200 pt-3 text-[11px] text-stone-500">
                {slide.footnote || "Abstract-only analysis; verify against full text before high-stakes use."}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
