import { describe, expect, it } from "vitest";
import { buildOpenAlexSearch, buildPubMedQuery, extractKeywords, generateAcademicQueries } from "@/lib/scholarly/query";

describe("query generation", () => {
  it("accepts keyword-style input", () => {
    expect(extractKeywords("CRISPR delivery")).toEqual(["crispr", "delivery"]);
    expect(buildOpenAlexSearch("CRISPR delivery")).toBe("crispr delivery");
  });

  it("removes filler words and dates from broad questions", () => {
    const queries = generateAcademicQueries("What are the latest peer-reviewed findings on CRISPR delivery from 2021?");
    expect(queries[0].query).toBe("crispr delivery");
    expect(queries).toHaveLength(3);
  });

  it("builds a PubMed query with date and publication-type filters", () => {
    const query = buildPubMedQuery("CRISPR delivery", 2021, 2026);
    expect(query).toContain("crispr[Title/Abstract]");
    expect(query).toContain("delivery[Title/Abstract]");
    expect(query).toContain('"2021"[Date - Publication]');
    expect(query).toContain("journal article[Publication Type]");
  });
});
