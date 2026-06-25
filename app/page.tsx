"use client";

import { FormEvent, useState } from "react";
import { LandingHero } from "@/components/research/LandingHero";
import { LoadingState } from "@/components/research/LoadingState";
import { ResearchReport } from "@/components/research/ResearchReport";
import type { ResearchFormState } from "@/components/research/types";
import type { ResearchResult } from "@/lib/types/paper";

const defaultForm: ResearchFormState = {
  question: "",
  startYear: 2021,
  endYear: 2026,
  maxPapers: 10,
  includePreprints: false,
  outputType: "brief"
};

export default function Home() {
  const [form, setForm] = useState<ResearchFormState>(defaultForm);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function startNewSearch() {
    setError(null);
    setLoading(false);
    setResult(null);
  }

  async function runResearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submittedQuestion = String(formData.get("question") || form.question).trim();
    const requestForm = { ...form, question: submittedQuestion };

    setForm(requestForm);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestForm)
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Research request failed.");
      }

      setResult(payload as ResearchResult);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Research request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    !result ? (
      <LandingHero error={error} form={form} loading={loading} onChange={setForm} onSubmit={runResearch} />
    ) : (
    <main className="min-h-screen bg-[#f7f3ea] text-ink">
      {loading ? (
        <LoadingState />
      ) : (
        <ResearchReport error={error} onNewSearch={startNewSearch} result={result} />
      )}
    </main>
    )
  );
}
