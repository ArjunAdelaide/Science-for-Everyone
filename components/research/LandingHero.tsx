"use client";

import type { FormEvent } from "react";
import type { ResearchFormState } from "@/components/research/types";

const SCIENTIST_BACKDROPS = [
  {
    name: "Terence Tao",
    image: "https://www.masterclass.com/course-images/attachments/3udqajqs3z7vvqiqbm54eprttjda?format=webp&quality=75&width=1920",
    fallbackImage: "/landing/feynman-blackboard.png",
    position: "center"
  },
  {
    name: "Richard Feynman",
    image: "/landing/feynman-blackboard.png",
    position: "center"
  },
  {
    name: "J. Robert Oppenheimer",
    image:
      "https://bostonglobe-prod.cdn.arcpublishing.com/resizer/v2/C5YIKFSROMI6JBDZEAFGCUUKVU.jpg?auth=c457b374c4930197c08be278659db1cf39ca96c1e3b0b42080498d8cc967d00e&width=1440",
    fallbackImage: "/landing/feynman-blackboard.png",
    position: "center"
  },
  {
    name: "Albert Einstein",
    image: "https://www.huntington.org/sites/default/files/uploads/2016/03/einsteinwaves-1.jpg",
    fallbackImage: "/landing/feynman-blackboard.png",
    position: "center"
  },
  {
    name: "Edward Teller",
    image:
      "https://www.blikk.hu/static/image-transforms/1/oF0ktkpTURBXy8xOGRlNTMyZjJlNmJkZGRlMmY1ZjJkNzJmNGQ0ZjhkOC5qcGeRlQMAzKzNC_TNBrk",
    fallbackImage: "/landing/feynman-blackboard.png",
    position: "center"
  },
  {
    name: "Marie Curie",
    image: "/landing/marie-curie-lab.jpg",
    position: "center"
  }
];

type LandingHeroProps = {
  error: string | null;
  form: ResearchFormState;
  loading: boolean;
  onChange: (form: ResearchFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LandingHero({ error, form, loading, onChange, onSubmit }: LandingHeroProps) {
  return (
    <main className="landing-root relative min-h-screen overflow-hidden text-ivory">
      <div aria-hidden="true" className="landing-atmosphere">
        <div className="landing-field" />
        <div className="landing-portrait-stage">
          {SCIENTIST_BACKDROPS.map((scientist, index) => (
            <div
              className="landing-scientist-slide"
              key={scientist.name}
              style={{
                animationDelay: `${index * 4.6}s`,
                backgroundImage: scientist.fallbackImage
                  ? `url("${scientist.image}"), url("${scientist.fallbackImage}")`
                  : `url("${scientist.image}")`,
                backgroundPosition: scientist.position
              }}
            />
          ))}
        </div>
        <div className="landing-noise" />
      </div>

      <header className="landing-nav">
        <span>Science for Everyone</span>
      </header>

      <section className="relative z-10 flex min-h-screen items-center px-5">
        <div className="mx-auto grid w-full max-w-7xl gap-12 py-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="landing-eyebrow">Research intelligence for curious people</p>
            <h1 className="landing-title">
              Science is for everyone.
              <span>Learn something.</span>
            </h1>
          </div>

          <div className="landing-console" id="search">
            <form onSubmit={onSubmit} className="landing-search-shell">
              <label className="sr-only" htmlFor="landing-query">
                Research topic, keyword, or question
              </label>
              <input
                id="landing-query"
                name="question"
                className="min-h-16 w-full border-0 bg-transparent pr-12 text-lg font-light text-ivory outline-none placeholder:text-ivory/42 md:text-xl"
                placeholder={loading ? "Building evidence..." : "Ask anything"}
                value={form.question}
                onChange={(event) => onChange({ ...form, question: event.target.value })}
              />
              <button className="landing-submit" disabled={loading} type="submit" aria-label="Generate research package">
                <span aria-hidden="true">→</span>
              </button>
            </form>

            {error ? <p className="mt-5 border border-red-300/30 bg-red-950/40 p-3 text-sm text-red-100">{error}</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
