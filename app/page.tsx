"use client";

import { FormEvent, useState } from "react";
import { DeckPreview } from "@/components/research/DeckPreview";
import { LandingHero } from "@/components/research/LandingHero";
import { LoadingState } from "@/components/research/LoadingState";
import type { DeckDownload, ResearchFormState } from "@/components/research/types";
import type { ResearchResult } from "@/lib/types/paper";

const defaultForm: ResearchFormState = {
  question: "",
  startYear: 2021,
  endYear: 2026,
  maxPapers: 10,
  includePreprints: false,
  outputType: "deck"
};

export default function Home() {
  const [form, setForm] = useState<ResearchFormState>(defaultForm);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingDeck, setDownloadingDeck] = useState(false);
  const [deckDownload, setDeckDownload] = useState<DeckDownload | null>(null);

  function clearDeckDownload() {
    setDeckDownload(null);
  }

  function startNewSearch() {
    clearDeckDownload();
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
    clearDeckDownload();

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

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload.error || "Deck generation failed.");
      }

      const payload = (await response.json()) as {
        downloadUrl?: string;
        fileName?: string;
      };
      if (!payload.downloadUrl || !payload.fileName) {
        throw new Error("Deck generation did not return a download link.");
      }

      const downloadUrl = new URL(payload.downloadUrl, window.location.origin).toString();
      setDeckDownload({ url: downloadUrl, fileName: payload.fileName });

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = payload.fileName;
      link.rel = "noopener";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (deckError) {
      setError(deckError instanceof Error ? deckError.message : "Deck generation failed.");
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
        <DeckPreview
          deckDownload={deckDownload}
          downloadingDeck={downloadingDeck}
          error={error}
          onDownload={downloadDeck}
          onNewSearch={startNewSearch}
          result={result}
          slides={result.deckSlides}
        />
      )}
    </main>
    )
  );
}
