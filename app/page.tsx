"use client";

import { FormEvent, useEffect, useState } from "react";
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

  useEffect(() => {
    return () => {
      if (deckDownload?.url) URL.revokeObjectURL(deckDownload.url);
    };
  }, [deckDownload]);

  function clearDeckDownload() {
    setDeckDownload((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
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
      const response = await fetch("/api/research/deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result })
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Deck generation failed.");
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const disposition = response.headers.get("Content-Disposition") || "";
      const fileName = disposition.match(/filename="([^"]+)"/)?.[1] || "ezresearch-deck.pptx";

      setDeckDownload((current) => {
        if (current?.url) URL.revokeObjectURL(current.url);
        return { url: downloadUrl, fileName };
      });

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      link.rel = "noopener";
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
          onDownload={downloadDeck}
          result={result}
          slides={result.deckSlides}
        />
      )}
    </main>
    )
  );
}
