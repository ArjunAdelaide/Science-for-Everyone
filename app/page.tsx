"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { DeckPreview } from "@/components/research/DeckPreview";
import { LandingHero } from "@/components/research/LandingHero";
import { LoadingState } from "@/components/research/LoadingState";
import { SourcesColumn } from "@/components/research/SourcesColumn";
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

  const averageScore = useMemo(() => {
    if (!result?.papers.length) return 0;
    const total = result.papers.reduce((sum, paper) => sum + (paper.score?.finalScore || 0), 0);
    return Math.round(total / result.papers.length);
  }, [result]);

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
    <main className="min-h-screen bg-[#f4efe3] text-ink">
      <div className="mx-auto grid max-w-[1500px] gap-5 px-5 py-5 lg:grid-cols-[340px_1fr]">
        <SourcesColumn averageScore={averageScore} papers={result.papers} result={result} />

        <section className="order-1 lg:order-2">
          {loading ? (
            <LoadingState />
          ) : (
            <DeckPreview
              deckDownload={deckDownload}
              downloadingDeck={downloadingDeck}
              onDownload={downloadDeck}
              question={result.question}
              result={result}
              slides={result.deckSlides}
            />
          )}
        </section>
      </div>
    </main>
    )
  );
}
