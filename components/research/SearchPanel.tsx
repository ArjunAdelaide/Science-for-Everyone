"use client";

import type { FormEvent } from "react";
import type { ResearchFormState } from "@/components/research/types";
import type { OutputType } from "@/lib/types/paper";

type SearchPanelProps = {
  error: string | null;
  form: ResearchFormState;
  loading: boolean;
  onChange: (form: ResearchFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function SearchPanel({ error, form, loading, onChange, onSubmit }: SearchPanelProps) {
  return (
    <form onSubmit={onSubmit} className="h-fit border border-stone-300 bg-white p-5 shadow-panel">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-signal">Search scope</p>
        <h2 className="mt-1 text-lg font-semibold text-ink">Build an evidence package</h2>
        <p className="mt-2 text-sm leading-6 text-stone-700">
          Enter a topic, keyword, or research question. EzResearch retrieves papers, ranks evidence, and prepares a
          cited report plus deck.
        </p>
      </div>

      <label className="mt-5 block text-sm font-semibold text-ink" htmlFor="question">
        Topic, keyword, or question
      </label>
      <textarea
        id="question"
        name="question"
        className="mt-2 min-h-32 w-full border border-stone-300 bg-stone-50 p-3 text-sm leading-6 outline-none focus:border-signal focus:bg-white"
        value={form.question}
        onChange={(event) => onChange({ ...form, question: event.target.value })}
      />

      <div className="mt-5 grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold text-ink">
          Start year
          <input
            className="mt-2 w-full border border-stone-300 bg-stone-50 p-2 outline-none focus:border-signal focus:bg-white"
            type="number"
            min="1900"
            max="2030"
            value={form.startYear}
            onChange={(event) => onChange({ ...form, startYear: Number(event.target.value) })}
          />
        </label>
        <label className="block text-sm font-semibold text-ink">
          End year
          <input
            className="mt-2 w-full border border-stone-300 bg-stone-50 p-2 outline-none focus:border-signal focus:bg-white"
            type="number"
            min="1900"
            max="2030"
            value={form.endYear}
            onChange={(event) => onChange({ ...form, endYear: Number(event.target.value) })}
          />
        </label>
      </div>

      <label className="mt-5 block text-sm font-semibold text-ink">
        Max papers
        <input
          className="mt-2 w-full accent-signal"
          type="range"
          min="3"
          max="30"
          value={form.maxPapers}
          onChange={(event) => onChange({ ...form, maxPapers: Number(event.target.value) })}
        />
        <span className="mt-1 block text-sm font-normal text-stone-700">{form.maxPapers} papers</span>
      </label>

      <label className="mt-5 flex items-start gap-3 text-sm text-stone-800">
        <input
          className="mt-1 h-4 w-4 accent-signal"
          type="checkbox"
          checked={form.includePreprints}
          onChange={(event) => onChange({ ...form, includePreprints: event.target.checked })}
        />
        Include records that metadata suggests may be preprints
      </label>

      <label className="mt-5 block text-sm font-semibold text-ink">
        Primary output
        <select
          className="mt-2 w-full border border-stone-300 bg-stone-50 p-2 outline-none focus:border-signal focus:bg-white"
          value={form.outputType}
          onChange={(event) => onChange({ ...form, outputType: event.target.value as OutputType })}
        >
          <option value="both">Research report and PowerPoint deck</option>
          <option value="brief">Research report only</option>
          <option value="deck">PowerPoint deck only</option>
        </select>
      </label>

      <button
        className="mt-6 w-full bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-signal disabled:cursor-not-allowed disabled:bg-stone-500"
        disabled={loading}
        type="submit"
      >
        {loading ? "Searching and synthesising..." : "Generate intelligence package"}
      </button>

      {error ? <p className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
    </form>
  );
}
