"use client";

import type { EvidenceClaim, Paper, ResearchFinding, ResearchResult } from "@/lib/types/paper";

type ResearchReportProps = {
  error: string | null;
  onNewSearch: () => void;
  result: ResearchResult;
};

function cite(paper?: Paper): string {
  if (!paper) return "Source unavailable";
  const leadAuthor = paper.authors[0]?.split(" ").pop() || "Unknown";
  return `${leadAuthor} et al., ${paper.year || "n.d."}`;
}

function sourceLabel(source: Paper["source"]): string {
  if (source === "pubmed") return "PubMed";
  if (source === "openalex") return "OpenAlex";
  return "Demo";
}

function confidenceTone(confidence: EvidenceClaim["confidence"]): string {
  if (confidence === "High") return "border-emerald-700/20 bg-emerald-50 text-emerald-950";
  if (confidence === "Moderate") return "border-amber-700/20 bg-amber-50 text-amber-950";
  return "border-stone-400/30 bg-stone-100 text-stone-700";
}

function paperById(papers: Paper[], id: string): Paper | undefined {
  return papers.find((paper) => paper.id === id);
}

function FindingCard({ finding, index, papers }: { finding: ResearchFinding; index: number; papers: Paper[] }) {
  const supportingPapers = finding.supportingPaperIds.map((id) => paperById(papers, id)).filter((paper): paper is Paper => Boolean(paper));

  return (
    <article className="border-t border-stone-300 py-7">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Finding {index + 1}</span>
        <span className="border border-stone-300 px-2 py-1 text-xs font-medium text-stone-600">{finding.evidenceLevel} signal</span>
      </div>
      <h3 className="mt-3 text-2xl font-semibold leading-tight text-ink">{finding.title}</h3>
      <p className="mt-4 text-base leading-7 text-stone-800">{finding.takeaway}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Why It Matters</p>
          <p className="mt-2 text-sm leading-6 text-stone-700">{finding.whyItMatters}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Evidence Detail</p>
          <p className="mt-2 text-sm leading-6 text-stone-700">{finding.supportingDetails[0] || finding.explanation}</p>
        </div>
      </div>
      <p className="mt-5 text-sm leading-6 text-stone-600">
        <span className="font-semibold text-stone-800">Supported by:</span>{" "}
        {supportingPapers.length ? supportingPapers.slice(0, 3).map(cite).join("; ") : "mapped sources unavailable"}.
      </p>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        <span className="font-semibold text-stone-800">Limit:</span> {finding.limitations[0] || "Full-text validation required."}
      </p>
    </article>
  );
}

function EvidenceRow({ claim, papers }: { claim: EvidenceClaim; papers: Paper[] }) {
  const supportingPapers = claim.supportingPaperIds.map((id) => paperById(papers, id)).filter((paper): paper is Paper => Boolean(paper));

  return (
    <div className="grid gap-4 border-t border-stone-300 py-5 lg:grid-cols-[1.2fr_0.8fr_120px]">
      <div>
        <p className="text-sm font-semibold leading-6 text-ink">{claim.claim}</p>
        <p className="mt-2 text-sm leading-6 text-stone-600">{claim.explanation}</p>
      </div>
      <div className="text-sm leading-6 text-stone-700">
        {supportingPapers.length ? supportingPapers.slice(0, 3).map(cite).join("; ") : "No source mapped"}
      </div>
      <div>
        <span className={`inline-flex border px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${confidenceTone(claim.confidence)}`}>
          {claim.confidence}
        </span>
      </div>
    </div>
  );
}

function SourceCard({ paper, index }: { paper: Paper; index: number }) {
  return (
    <article className="border-t border-stone-300 py-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Source {index + 1}</span>
        <span className="text-xs font-semibold text-signal">{paper.score?.finalScore ?? "n/a"}/100</span>
      </div>
      <h4 className="mt-2 text-sm font-semibold leading-5 text-ink">{paper.title}</h4>
      <p className="mt-2 text-xs leading-5 text-stone-600">
        {paper.year || "n.d."} · {paper.journal || sourceLabel(paper.source)} · {sourceLabel(paper.source)}
      </p>
      {paper.doi ? <p className="mt-1 break-all text-xs leading-5 text-stone-500">DOI: {paper.doi}</p> : null}
      <p className="mt-3 text-xs leading-5 text-stone-600">
        {paper.reasonIncluded || paper.score?.explanation[0] || "Included because it ranked highly for relevance and source metadata."}
      </p>
    </article>
  );
}

export function ResearchReport({ error, onNewSearch, result }: ResearchReportProps) {
  const warning = error || result.warnings[0];
  const primer = result.synthesis.topicPrimer;
  const dateRange = `${result.methodology.dateRange.startYear}-${result.methodology.dateRange.endYear}`;
  const dataModeLabel = result.dataMode === "mock-fallback" ? "Demo data" : result.dataMode === "empty" ? "No live records" : "Live sources";
  const synthesisModeLabel = result.synthesis.synthesisMode === "expert-agent" ? "Expert synthesis" : "Deterministic synthesis";

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-4 py-5 text-ink sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            className="inline-flex h-9 items-center border border-ink/15 bg-white/85 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink shadow-sm transition hover:border-ink hover:bg-white"
            onClick={onNewSearch}
            type="button"
          >
            New search
          </button>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-stone-600">
            <span className="border border-ink/10 bg-white/70 px-3 py-2">{dataModeLabel}</span>
            <span className="border border-ink/10 bg-white/70 px-3 py-2">{synthesisModeLabel}</span>
            <span className="border border-ink/10 bg-white/70 px-3 py-2">{dateRange}</span>
          </div>
        </div>

        {warning ? <div className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-950">{warning}</div> : null}

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="bg-white px-5 py-7 shadow-[0_18px_50px_rgba(17,24,39,0.08)] sm:px-8 lg:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Recent Findings Report</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.05] text-ink sm:text-5xl">{result.question}</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-stone-700">
              {result.synthesis.executiveAnswer || "This report compresses retrieved scholarly abstracts and metadata into an auditable recent-findings brief."}
            </p>
            <div className="mt-7 grid gap-3 border-y border-stone-300 py-4 text-sm text-stone-700 sm:grid-cols-3">
              <p><span className="font-semibold text-ink">{result.papers.length}</span> ranked sources</p>
              <p><span className="font-semibold text-ink">{dateRange}</span> search window</p>
              <p><span className="font-semibold text-ink">Abstract-only</span> analysis depth</p>
            </div>

            <section className="py-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Field Primer</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">{primer.topic} in plain English</h2>
              <p className="mt-4 text-base leading-7 text-stone-800">{primer.overview}</p>
              <p className="mt-4 text-base leading-7 text-stone-700">{primer.whyItMatters}</p>
              {primer.keyTerms.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {primer.keyTerms.slice(0, 10).map((term) => (
                    <span className="border border-stone-300 px-2 py-1 text-xs font-medium text-stone-600" key={term}>{term}</span>
                  ))}
                </div>
              ) : null}
            </section>

            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Recent Findings</p>
              {result.synthesis.findings.length ? (
                result.synthesis.findings.slice(0, 5).map((finding, index) => (
                  <FindingCard finding={finding} index={index} key={finding.id} papers={result.papers} />
                ))
              ) : (
                <p className="border-t border-stone-300 py-7 text-sm text-stone-600">No source-backed findings were generated for this query.</p>
              )}
            </section>

            <section className="pt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Evidence Table</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">Claims stay linked to retrieved papers</h2>
              <div className="mt-4">
                {result.evidenceTable.length ? (
                  result.evidenceTable.slice(0, 6).map((claim) => <EvidenceRow claim={claim} key={claim.claim} papers={result.papers} />)
                ) : (
                  <p className="border-t border-stone-300 py-5 text-sm text-stone-600">No evidence claims were generated.</p>
                )}
              </div>
            </section>

            <section className="pt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Limits</p>
              <ul className="mt-4 grid gap-3 text-sm leading-6 text-stone-700">
                {result.synthesis.uncertainties.slice(0, 3).map((item) => <li key={item}>- {item}</li>)}
                <li>- Claims are generated from abstracts and metadata, not full text, figures, tables, or supplements.</li>
              </ul>
            </section>
          </article>

          <aside className="h-fit bg-white px-5 py-6 shadow-[0_18px_50px_rgba(17,24,39,0.08)] lg:sticky lg:top-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Sources</p>
            <h2 className="mt-3 text-xl font-semibold text-ink">Ranked Evidence Base</h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Papers are ranked by relevance, recency, publication type, citation signals, and source metadata.
            </p>
            <div className="mt-4">
              {result.papers.length ? (
                result.papers.slice(0, 8).map((paper, index) => <SourceCard index={index} key={paper.id} paper={paper} />)
              ) : (
                <p className="border-t border-stone-300 py-4 text-sm text-stone-600">No sources passed filtering.</p>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
