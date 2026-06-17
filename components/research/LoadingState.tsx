"use client";

export function LoadingState() {
  return (
    <section className="border border-stone-300 bg-white p-8 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-wide text-signal">Building package</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">Retrieving, scoring, and synthesising evidence</h2>
      <div className="mt-5 space-y-3">
        {["Searching PubMed and OpenAlex", "Deduplicating and filtering records", "Generating report and deck preview"].map(
          (label, index) => (
            <div className="flex items-center gap-3" key={label}>
              <span
                className="h-2.5 w-2.5 animate-pulse bg-signal"
                style={{ animationDelay: `${index * 160}ms` }}
              />
              <span className="text-sm text-stone-700">{label}</span>
            </div>
          )
        )}
      </div>
    </section>
  );
}
