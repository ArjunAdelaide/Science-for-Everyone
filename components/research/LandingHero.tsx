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

const MOTION_FRAMES = [
  {
    label: "combat mechanics",
    metric: "hip torque / guard angle / center line",
    formula: "τ = r × F"
  },
  {
    label: "throwing motion",
    metric: "release angle / spin axis / kinetic chain",
    formula: "v₀² sin(2θ) / g"
  },
  {
    label: "proof space",
    metric: "assumption / contradiction / theorem",
    formula: "∀ε > 0, ∃δ > 0"
  },
  {
    label: "sound structure",
    metric: "rhythm / frequency / harmonic tension",
    formula: "f(t)=Σ Aₙ sin(nωt+φₙ)"
  }
];

function CombatStudy() {
  return (
    <svg aria-hidden="true" className="motion-figure" viewBox="0 0 720 420">
      <path className="motion-grid-line" d="M90 325H640" />
      <path className="motion-trace" d="M355 95L315 155L345 218L302 310" />
      <path className="motion-trace" d="M345 218L425 300" />
      <path className="motion-trace" d="M318 154L235 192L165 174" />
      <path className="motion-trace hot" d="M318 154L405 145L480 105" />
      <path className="motion-vector" d="M405 145L545 92" />
      <path className="motion-vector" d="M302 310L232 334" />
      <path className="motion-arc" d="M342 217A82 82 0 0 1 424 300" />
      <path className="motion-arc hot" d="M330 160A108 108 0 0 1 480 105" />
      {[355, 315, 345, 302, 425, 235, 165, 405, 480].map((x, index) => {
        const y = [95, 155, 218, 310, 300, 192, 174, 145, 105][index];
        return <circle className="motion-joint" cx={x} cy={y} key={`${x}-${y}`} r="7" />;
      })}
      <text className="motion-note" x="446" y="78">shoulder rotation 38°</text>
      <text className="motion-note" x="390" y="258">base stability</text>
    </svg>
  );
}

function QuarterbackStudy() {
  return (
    <svg aria-hidden="true" className="motion-figure" viewBox="0 0 720 420">
      <path className="motion-grid-line" d="M90 330H650" />
      <path className="motion-trace" d="M295 108L315 174L292 246L258 328" />
      <path className="motion-trace" d="M292 246L355 326" />
      <path className="motion-trace hot" d="M315 174L405 134L468 74" />
      <path className="motion-trace" d="M315 174L245 214L188 265" />
      <path className="motion-trajectory" d="M468 74C548 42 618 78 664 154" />
      <path className="motion-vector hot" d="M468 74L612 72" />
      <path className="motion-vector" d="M355 326L410 332" />
      <path className="motion-arc hot" d="M397 137A74 74 0 0 1 468 74" />
      <ellipse className="motion-ball" cx="654" cy="144" rx="16" ry="9" transform="rotate(26 654 144)" />
      {[295, 315, 292, 258, 355, 405, 468, 245, 188].map((x, index) => {
        const y = [108, 174, 246, 328, 326, 134, 74, 214, 265][index];
        return <circle className="motion-joint" cx={x} cy={y} key={`${x}-${y}`} r="7" />;
      })}
      <text className="motion-note" x="506" y="116">release window 42°</text>
      <text className="motion-note" x="430" y="358">hip-to-shoulder separation</text>
    </svg>
  );
}

function ProofStudy() {
  return (
    <svg aria-hidden="true" className="motion-figure proof-figure" viewBox="0 0 720 420">
      <text className="proof-line" x="92" y="105">Assume x ∈ A and A ⊂ B</text>
      <text className="proof-line hot" x="126" y="168">lim h→0 [f(x+h)-f(x)] / h</text>
      <text className="proof-line" x="92" y="232">∇ · E = ρ / ε₀</text>
      <text className="proof-line" x="188" y="298">contradiction ⇒ theorem</text>
      <path className="motion-arc" d="M112 128C210 78 330 82 454 130" />
      <path className="motion-vector hot" d="M500 168L604 168" />
      <path className="motion-grid-line" d="M88 330H620" />
    </svg>
  );
}

function MusicStudy() {
  return (
    <svg aria-hidden="true" className="motion-figure" viewBox="0 0 720 420">
      {[122, 152, 182, 212, 242].map((y) => (
        <path className="motion-grid-line staff" d={`M92 ${y}H632`} key={y} />
      ))}
      <path className="motion-wave hot" d="M95 315C138 248 178 382 225 315S312 248 358 315S445 382 492 315S582 248 632 315" />
      <path className="motion-wave" d="M95 82C145 42 185 122 236 82S330 42 382 82S480 122 536 82S604 46 640 82" />
      <circle className="music-note hot" cx="210" cy="182" r="18" />
      <path className="music-stem hot" d="M228 182V96" />
      <circle className="music-note" cx="382" cy="212" r="18" />
      <path className="music-stem" d="M400 212V126" />
      <circle className="music-note" cx="520" cy="152" r="18" />
      <path className="music-stem" d="M538 152V66" />
      <text className="motion-note" x="112" y="364">440Hz → harmonic stack</text>
      <text className="motion-note" x="432" y="108">tension resolves</text>
    </svg>
  );
}

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
    const timer = window.setTimeout(() => setIntroVisible(false), 4300);
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
        <div aria-hidden="true" className="science-opener motion-opener absolute inset-0 z-20">
          {MOTION_FRAMES.map((frame, index) => (
            <div className="motion-frame" key={frame.label} style={{ animationDelay: `${index * 880}ms` }}>
              <div className="motion-card">
                <div className="motion-copy">
                  <p>{frame.label}</p>
                  <span>{frame.metric}</span>
                </div>
                <div className="motion-formula">{frame.formula}</div>
                {index === 0 ? <CombatStudy /> : null}
                {index === 1 ? <QuarterbackStudy /> : null}
                {index === 2 ? <ProofStudy /> : null}
                {index === 3 ? <MusicStudy /> : null}
              </div>
            </div>
          ))}
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
              name="question"
              className="min-h-16 w-full border-0 bg-transparent px-1 text-center text-lg font-light text-white/85 outline-none placeholder:text-stone-200/55 md:text-xl"
              placeholder={loading ? "Working..." : "Ask anything"}
              value={form.question}
              onChange={(event) => onChange({ ...form, question: event.target.value })}
            />
            <button className="landing-submit" disabled={loading} type="submit" aria-label="Generate research package">
              <span aria-hidden="true">→</span>
            </button>
            {error ? <p className="mt-4 border border-red-300/40 bg-red-950/70 p-3 text-sm text-red-100">{error}</p> : null}
          </form>
        </div>
      </section>
    </main>
  );
}
