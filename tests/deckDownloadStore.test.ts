import { afterEach, describe, expect, it, vi } from "vitest";
import { getDeckDownload, storeDeckDownload } from "@/lib/synthesis/deckDownloadStore";

describe("deck download store", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores generated decks behind short-lived ids", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T00:00:00Z"));

    const id = storeDeckDownload(Buffer.from("pptx"), "ezresearch-test.pptx");

    expect(getDeckDownload(id)?.fileName).toBe("ezresearch-test.pptx");

    vi.setSystemTime(new Date("2026-06-22T00:16:00Z"));

    expect(getDeckDownload(id)).toBeNull();
  });
});
