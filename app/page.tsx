"use client";

import { FormEvent, useState } from "react";
import { LandingHero } from "@/components/research/LandingHero";
import { LoadingState } from "@/components/research/LoadingState";
import { ResearchReport } from "@/components/research/ResearchReport";
import type { DeckDownload, ResearchFormState } from "@/components/research/types";
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
  const [deckDownload, setDeckDownload] = useState<DeckDownload | null>(null);
  const [downloadingDeck, setDownloadingDeck] = useState(false);

  function startNewSearch() {
    setForm(defaultForm);
    setError(null);
    setLoading(false);
    setResult(null);
    setDeckDownload(null);
    setDownloadingDeck(false);
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
      setDeckDownload(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Research request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadDeck() {
    if (!result) return;

    setDownloadingDeck(true);
    setError(null);

    try {
      const response = await fetch("/api/research/deck?delivery=link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Deck generation failed.");
      }

      setDeckDownload({
        fileName: payload.fileName || "ezresearch-deck.pptx",
        url: payload.downloadUrl
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Deck generation failed.");
    } finally {
      setDownloadingDeck(false);
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
        <ResearchReport
          deckDownload={deckDownload}
          downloadingDeck={downloadingDeck}
          error={error}
          onDownloadDeck={downloadDeck}
          onNewSearch={startNewSearch}
          result={result}
        />
      )}
    </main>
    )
  );
}
