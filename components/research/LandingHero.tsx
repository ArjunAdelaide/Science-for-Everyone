"use client";

import type { FormEvent } from "react";
import type { ResearchFormState } from "@/components/research/types";

const SIGNALS = ["sports", "maths", "music", "medicine", "papers", "proof", "evidence", "strategy"];
const SCIENTISTS = [
  "Marie Curie",
  "Richard Feynman",
  "Katherine Johnson",
  "Ada Lovelace",
  "S. Ramanujan",
  "Rosalind Franklin",
  "Alan Turing",
  "Jane Goodall"
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
        <div className="landing-scientists">
          {SCIENTISTS.map((scientist) => (
            <span key={scientist}>{scientist}</span>
          ))}
        </div>
        <div className="landing-ledger">
          <span>evidence → claim → citation</span>
          <span>ranked papers / source metadata / deck output</span>
          <span>abstract-only analysis / transparent limits</span>
        </div>
        <div className="landing-noise" />
      </div>

      <header className="landing-nav">
        <span>Science for Everyone</span>
        <nav aria-label="Landing navigation">
          <a href="#search">Search</a>
          <a href="#method">Evidence</a>
          <a href="#deck">Decks</a>
        </nav>
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
            <p className="landing-console-title">Ask a topic, keyword, or question.</p>
            <div className="landing-signal-row" aria-hidden="true">
              {SIGNALS.map((signal) => (
                <span key={signal}>{signal}</span>
              ))}
            </div>

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

            <div className="landing-proof-strip" id="method">
              <span>PubMed</span>
              <span>OpenAlex</span>
              <span>Ranked evidence</span>
              <span id="deck">Deck-ready output</span>
            </div>

            {error ? <p className="mt-5 border border-red-300/30 bg-red-950/40 p-3 text-sm text-red-100">{error}</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
