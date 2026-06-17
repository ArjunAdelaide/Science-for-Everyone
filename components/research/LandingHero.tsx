"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { ResearchFormState } from "@/components/research/types";

const SCIENCE_BACKDROPS = [
  {
    name: "Richard Feynman teaching",
    image: "/landing/feynman-blackboard.png",
    position: "center"
  },
  {
    name: "Marie Curie in the laboratory",
    image: "/landing/marie-curie-lab.jpg",
    position: "center"
  },
  {
    name: "Katherine Johnson working at NASA",
    image: "/landing/katherine-johnson-work.jpg",
    position: "center"
  }
];

const PEN_FORMULAS = [
  { expression: "E = mc²", x: 12, y: 18, size: "large" },
  { expression: "∂ψ/∂t = Ĥψ", x: 56, y: 14, size: "medium" },
  { expression: "∀ε > 0, ∃δ > 0", x: 24, y: 30, size: "small" },
  { expression: "Gμν + Λgμν = 8πGTμν/c⁴", x: 34, y: 42, size: "large" },
  { expression: "∫∫∫ ρ dV = M", x: 13, y: 54, size: "medium" },
  { expression: "P(A|B)=P(B|A)P(A)/P(B)", x: 55, y: 60, size: "small" },
  { expression: "ΔS ≥ 0", x: 32, y: 72, size: "large" },
  { expression: "∇ · E = ρ/ε₀", x: 66, y: 24, size: "medium" },
  { expression: "QED: contradiction ⇒ theorem", x: 18, y: 82, size: "small" },
  { expression: "lim n→∞ Σ f(xᵢ)Δx", x: 62, y: 78, size: "small" }
];

type LandingHeroProps = {
  error: string | null;
  form: ResearchFormState;
  loading: boolean;
  onChange: (form: ResearchFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LandingHero({ error, form, loading, onChange, onSubmit }: LandingHeroProps) {
  const [introVisible, setIntroVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroVisible(false), 3200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-white">
      <div className="absolute inset-0">
        {SCIENCE_BACKDROPS.map((backdrop, index) => (
          <div
            aria-hidden="true"
            className="landing-slide absolute inset-0 bg-cover bg-center"
            key={backdrop.name}
            style={{
              animationDelay: `${index * 7}s`,
              backgroundImage: `url("${backdrop.image}")`,
              backgroundPosition: backdrop.position
            }}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,10,15,0.76),rgba(6,10,15,0.52),rgba(6,10,15,0.3))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_58%,rgba(15,118,110,0.14),transparent_42%)]" />
      </div>

      {introVisible ? (
        <div aria-hidden="true" className="science-opener pen-opener absolute inset-0 z-20">
          <div className="pen-paper">
            {PEN_FORMULAS.map((formula, index) => (
              <div
                className={`pen-formula pen-${formula.size}`}
                key={formula.expression}
                style={{
                  animationDelay: `${index * 260}ms`,
                  left: `${formula.x}%`,
                  top: `${formula.y}%`,
                  transform: `rotate(${(index % 5) * 3 - 6}deg)`
                }}
              >
                <span>{formula.expression}</span>
              </div>
            ))}
          </div>
          <div className="science-opener-flash" />
        </div>
      ) : null}

      <section className="relative z-10 flex min-h-screen items-center justify-center px-5">
        <div className="w-full max-w-3xl">
          <div className="landing-statement">
            <p>Science is for everyone.</p>
            <span>Learn something.</span>
          </div>
          <form onSubmit={onSubmit} className="landing-search-shell">
            <label className="sr-only" htmlFor="landing-query">
              Research topic, keyword, or question
            </label>
            <input
              id="landing-query"
              className="min-h-16 w-full border-0 bg-transparent px-1 text-center text-lg font-light text-white/85 outline-none placeholder:text-stone-200/55 md:text-xl"
              placeholder={loading ? "Working..." : "Ask anything"}
              value={form.question}
              onChange={(event) => onChange({ ...form, question: event.target.value })}
            />
            <button className="sr-only" disabled={loading} type="submit">
              Generate research package
            </button>
            {error ? <p className="mt-4 border border-red-300/40 bg-red-950/70 p-3 text-sm text-red-100">{error}</p> : null}
          </form>
        </div>
      </section>
    </main>
  );
}
