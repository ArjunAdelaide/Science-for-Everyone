"use client";

import type { CSSProperties, FormEvent } from "react";
import type { ResearchFormState } from "@/components/research/types";

const ARCHIVE_IMAGES = [
  {
    name: "Terence Tao",
    image: "https://www.masterclass.com/course-images/attachments/3udqajqs3z7vvqiqbm54eprttjda?format=webp&quality=75&width=1920",
    position: "68% center"
  },
  {
    name: "Richard Feynman",
    image: "/landing/feynman-blackboard.png",
    position: "56% center"
  },
  {
    name: "J. Robert Oppenheimer",
    image:
      "https://bostonglobe-prod.cdn.arcpublishing.com/resizer/v2/C5YIKFSROMI6JBDZEAFGCUUKVU.jpg?auth=c457b374c4930197c08be278659db1cf39ca96c1e3b0b42080498d8cc967d00e&width=1440",
    position: "64% center"
  },
  {
    name: "Albert Einstein",
    image: "https://www.huntington.org/sites/default/files/uploads/2016/03/einsteinwaves-1.jpg",
    position: "62% center"
  },
  {
    name: "Edward Teller",
    image:
      "https://www.blikk.hu/static/image-transforms/1/oF0ktkpTURBXy8xOGRlNTMyZjJlNmJkZGRlMmY1ZjJkNzJmNGQ0ZjhkOC5qcGeRlQMAzKzNC_TNBrk",
    position: "62% center"
  },
  {
    name: "Marie Curie",
    image: "/landing/marie-curie-lab.jpg",
    position: "62% center"
  }
];

const ARCHIVE_TILES = [
  { imageIndex: 1, className: "archive-tile-large", delay: "0ms", position: "50% center" },
  { imageIndex: 0, className: "archive-tile-portrait", delay: "120ms", position: "46% center" },
  { imageIndex: 5, className: "archive-tile-tall", delay: "240ms", position: "47% center" },
  { imageIndex: 3, className: "archive-tile-wide", delay: "360ms", position: "48% center" },
  { imageIndex: 2, className: "archive-tile-small-a", delay: "480ms", position: "50% center" },
  { imageIndex: 4, className: "archive-tile-small-b", delay: "600ms", position: "50% center" },
  { imageIndex: 1, className: "archive-tile-strip", delay: "720ms", position: "48% center" },
  { imageIndex: 5, className: "archive-tile-small-c", delay: "840ms", position: "45% center" }
];

type LandingHeroProps = {
  error: string | null;
  form: ResearchFormState;
  loading: boolean;
  onChange: (form: ResearchFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function getArchiveTileStyle(tile: (typeof ARCHIVE_TILES)[number]): CSSProperties {
  const image = ARCHIVE_IMAGES[tile.imageIndex];

  return {
    animationDelay: tile.delay,
    backgroundImage: `url("${image.image}")`,
    backgroundPosition: tile.position ?? image.position
  };
}

export function LandingHero({ error, form, loading, onChange, onSubmit }: LandingHeroProps) {
  return (
    <main className="landing-root relative min-h-screen overflow-hidden">
      <div aria-hidden="true" className="landing-atmosphere">
        <div className="landing-archive-wall">
          {ARCHIVE_TILES.map((tile) => (
            <div
              className={`landing-archive-tile ${tile.className}`}
              key={`${tile.className}-${tile.imageIndex}`}
              style={getArchiveTileStyle(tile)}
            />
          ))}
        </div>
        <div className="landing-paper-field" />
      </div>

      <section className="relative z-10 flex min-h-screen items-center px-5">
        <div className="mx-auto grid w-full max-w-7xl gap-10 py-28 lg:grid-cols-[0.95fr_0.72fr] lg:items-end">
          <div className="landing-copy">
            <h1 className="landing-title">
              The world of research is moving fast, let&apos;s slow it all down.
            </h1>
            <div className="landing-console" id="search">
              <form onSubmit={onSubmit} className="landing-search-shell">
                <label className="sr-only" htmlFor="landing-query">
                  Research topic, keyword, or question
                </label>
                <input
                  id="landing-query"
                  name="question"
                  className="landing-query-input"
                  placeholder={loading ? "Building evidence..." : "Search anything"}
                  value={form.question}
                  onChange={(event) => onChange({ ...form, question: event.target.value })}
                />
                <button className="landing-submit" disabled={loading} type="submit" aria-label="Generate research package">
                  <span aria-hidden="true">→</span>
                </button>
              </form>

              {error ? <p className="mt-5 border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p> : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
