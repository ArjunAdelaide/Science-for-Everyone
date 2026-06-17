"use client";

import type { ExcludedPaper } from "@/lib/types/paper";

export function ExcludedRecords({ records }: { records: ExcludedPaper[] }) {
  return (
    <section className="border border-stone-300 bg-white p-5 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-wide text-signal">Filtering</p>
      <h2 className="mt-1 text-xl font-semibold text-ink">Excluded records</h2>
      {records.length === 0 ? (
        <p className="mt-2 text-sm text-stone-700">No excluded records were returned for this run.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-stone-300 bg-stone-100">
                <th className="p-3">Title</th>
                <th className="p-3">Year</th>
                <th className="p-3">Source</th>
                <th className="p-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {records.map((item) => (
                <tr className="border-b border-stone-200 align-top" key={item.paper.id}>
                  <td className="p-3">{item.paper.title}</td>
                  <td className="p-3">{item.paper.year || "n.d."}</td>
                  <td className="p-3">{item.paper.journal || item.paper.source}</td>
                  <td className="p-3">{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
