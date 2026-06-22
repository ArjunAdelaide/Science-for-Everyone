import { randomUUID } from "crypto";

const DOWNLOAD_TTL_MS = 15 * 60 * 1000;

type StoredDeck = {
  buffer: Buffer;
  createdAt: number;
  fileName: string;
};

const deckDownloads = new Map<string, StoredDeck>();

function pruneExpiredDownloads(now = Date.now()) {
  deckDownloads.forEach((deck, id) => {
    if (now - deck.createdAt > DOWNLOAD_TTL_MS) {
      deckDownloads.delete(id);
    }
  });
}

export function storeDeckDownload(buffer: Buffer, fileName: string): string {
  pruneExpiredDownloads();
  const id = randomUUID();
  deckDownloads.set(id, {
    buffer,
    createdAt: Date.now(),
    fileName
  });
  return id;
}

export function getDeckDownload(id: string): StoredDeck | null {
  pruneExpiredDownloads();
  return deckDownloads.get(id) || null;
}
