"use client";

import type { FormEvent } from "react";
import type { ResearchFormState } from "@/components/research/types";

const SCIENTIST_BACKDROPS = [
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

type LandingHeroProps = {
  error: string | null;
  form: ResearchFormState;
  loading: boolean;
  onChange: (form: ResearchFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LandingHero({ error, form, loading, onChange, onSubmit }: LandingHeroProps) {
  return (
    <main className="landing-root relative min-h-screen overflow-hidden">
      <div aria-hidden="true" className="landing-atmosphere">
        <div className="landing-paper-field" />
        <div className="landing-photo-stage">
          {SCIENTIST_BACKDROPS.map((scientist, index) => (
            <div
              className="landing-photo-slide"
              key={scientist.name}
              style={{
                animationDelay: `${index * 4.6}s`,
                backgroundImage: `url("${scientist.image}")`,
                backgroundPosition: scientist.position
              }}
            />
          ))}
        </div>
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
