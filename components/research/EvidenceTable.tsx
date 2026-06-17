"use client";

import type { EvidenceClaim, Paper } from "@/lib/types/paper";

export function EvidenceTable({ claims, papers }: { claims: EvidenceClaim[]; papers: Paper[] }) {
  if (claims.length === 0) return null;

  return (
    <section className="border border-stone-300 bg-white p-5 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-wide text-signal">Audit trail</p>
      <h2 className="mt-1 text-xl font-semibold text-ink">Evidence table</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[840px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-stone-300 bg-stone-100">
              <th className="p-3">Claim</th>
              <th className="p-3">Supporting papers</th>
              <th className="p-3">Confidence</th>
              <th className="p-3">Limitations</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr className="border-b border-stone-200 align-top" key={claim.claim}>
                <td className="p-3 font-medium text-ink">{claim.claim}</td>
                <td className="p-3 text-stone-700">
                  {claim.supportingPaperIds
                    .map((id) => papers.find((paper) => paper.id === id)?.title || id)
                    .join("; ")}
                </td>
                <td className="p-3 text-stone-800">{claim.confidence}</td>
                <td className="p-3 text-stone-700">{claim.limitations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
