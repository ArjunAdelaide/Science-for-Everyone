import { describe, expect, it } from "vitest";
import { parseResearchRequest } from "@/lib/research/validation";

describe("research request validation", () => {
  it("allows short keyword searches", () => {
    const request = parseResearchRequest({ question: "cancer", startYear: 2024, endYear: 2022, maxPapers: 99 });
    expect(request.question).toBe("cancer");
    expect(request.startYear).toBe(2022);
    expect(request.endYear).toBe(2024);
    expect(request.maxPapers).toBe(30);
    expect(request.outputType).toBe("both");
  });

  it("rejects empty input", () => {
    expect(() => parseResearchRequest({ question: " " })).toThrow("Enter a research topic");
  });
});
