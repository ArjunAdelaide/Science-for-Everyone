import type { OutputType } from "@/lib/types/paper";

export type ResearchFormState = {
  question: string;
  startYear: number;
  endYear: number;
  maxPapers: number;
  includePreprints: boolean;
  outputType: OutputType;
};

export type DeckDownload = {
  url: string;
  fileName: string;
};
