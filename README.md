# EzResearch

Academic research intelligence for evidence-grounded briefs and decks.

EzResearch is a Next.js MVP that turns a biomedical research topic, keyword, or question into a presentation-ready evidence deck. The output is intentionally slide-first: the deck teaches the topic, explains recent findings, embeds source support, and keeps the PowerPoint download one click away.

It is intentionally not a full systematic-review engine. The current product works from public scholarly metadata and abstracts, keeps claims tied to retrieved records, and makes limitations visible.

## Why This Exists

Academic search tools are powerful, but they often leave users with a long list of papers and little synthesis. Generic summarizers can compress text, but they can also blur provenance or overstate evidence.

EzResearch explores a more trustworthy middle ground:

- retrieve credible scholarly records from public APIs
- filter and rank papers with explainable signals
- generate outputs that preserve citation traceability
- clearly label abstract-only analysis and metadata-inferred peer-review status

## Key Features

- Topic, keyword, or full-question input
- minimal, premium landing page inspired by frontier research lab websites
- PubMed / NCBI E-utilities retrieval
- OpenAlex retrieval with citation counts where available
- DOI/title deduplication
- likely scholarly journal filtering
- optional preprint inclusion
- transparent paper scoring
- optional OpenAI-powered expert synthesis layer for deeper topic explanation, paper-level insights, and presentation-ready finding slides
- deck-first results workspace with source support embedded inside each slide
- slide-by-slide deck preview with topic primer, scientific findings, implications, caveats, and references
- tiny icon-based `.pptx` download control via `pptxgenjs`
- explicit demo fallback records when live APIs fail, controlled by env var

## Demo Workflow

1. Start from the landing page and enter a topic such as `CRISPR delivery methods` or `glioblastoma immunotherapy`.
2. Generate the initial intelligence package.
3. Review the generated deck as the primary output.
4. Use the embedded source support on each slide to audit claims.
5. Download the editable PowerPoint deck from the small icon control.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- PubMed / NCBI E-utilities
- OpenAlex
- pptxgenjs
- Vitest

## Architecture

```text
app/
  api/research/route.ts          # JSON research package endpoint
  api/research/deck/route.ts     # PPTX export endpoint
  page.tsx                       # client-side workflow shell

components/research/
  LandingHero.tsx
  DeckPreview.tsx
  LoadingState.tsx
  types.ts

lib/
  research/
    validation.ts                # request parsing, bounds, fallback config
    runResearch.ts               # pipeline orchestration
  scholarly/
    pubmed.ts                    # PubMed retrieval and normalization
    openalex.ts                  # OpenAlex retrieval and normalization
    dedupe.ts                    # DOI/title dedupe
    filter.ts                    # likely scholarly filtering
    query.ts                     # keyword extraction and search queries
    mockPapers.ts                # labelled demo fallback records
  scoring/
    paperScore.ts                # transparent ranking model
  synthesis/
    briefGenerator.ts            # Markdown report
    deckPreview.ts               # structured consulting-style slide preview model
    deckGenerator.ts             # text deck outline
    expertSynthesis.ts           # optional OpenAI expert-agent synthesis layer
    pptxGenerator.ts             # PowerPoint export
  types/
    paper.ts                     # shared domain types
```

The app keeps retrieval, filtering, scoring, synthesis, UI, and export boundaries separate without adding a heavy framework.

## Scoring Methodology

Each paper receives a 0-100 score using visible components:

| Signal | Weight | What It Means |
|---|---:|---|
| Relevance | 50% | Keyword overlap across title, abstract, source, and publication type |
| Recency | 18% | Publication year within the selected date range |
| Evidence type | 24% | Publication metadata such as review, meta-analysis, clinical trial, or journal article |
| Citations | 8% | OpenAlex citation count when available |

Weak topical overlap receives an additional discount so highly cited but off-topic papers do not dominate.

This is deliberately simple and auditable. It is not a black-box ranking model.

## Safety and Limitations

EzResearch is designed to be transparent about what it can and cannot support:

- Analysis is abstract-and-metadata only.
- Full text, PDFs, figures, supplementary data, and detailed methods are not yet parsed.
- Peer-review status is inferred from source/publication metadata and should not be treated as guaranteed.
- Generated claims come only from retrieved abstracts and metadata.
- The evidence table links every claim to retrieved paper records.
- Demo fallback records are labelled and can be disabled.

For high-stakes academic, clinical, investment, or policy use, outputs should be treated as a starting point for expert review.

## Data Sources

### PubMed / NCBI E-utilities

Used for biomedical article search, publication type metadata, journal metadata, DOI metadata, and abstracts when available.

### OpenAlex

Used for broad scholarly search, reconstructed abstracts where available, source metadata, DOI metadata, and citation counts.

## Environment Variables

Copy `.env.example` to `.env.local` if desired:

```bash
NCBI_API_KEY=
NCBI_EMAIL=
NCBI_TOOL=EzResearch
OPENALEX_MAILTO=
OPENAI_RESEARCH_MODEL=gpt-5.5
EZRESEARCH_ENABLE_EXPERT_SYNTHESIS=true
EZRESEARCH_ENABLE_MOCK_FALLBACK=true
```

Notes:

- PubMed and OpenAlex can work without keys for the MVP.
- NCBI recommends setting an email/tool name.
- `NCBI_API_KEY` improves NCBI rate limits.
- `OPENAI_API_KEY` in `.env.local` enables the optional expert-agent synthesis layer.
- `OPENAI_RESEARCH_MODEL` controls the model used for expert synthesis.
- Set `EZRESEARCH_ENABLE_EXPERT_SYNTHESIS=false` to force deterministic synthesis.
- Set `EZRESEARCH_ENABLE_MOCK_FALLBACK=false` for strict live-data-only behavior.

## Deploying to Netlify

EzResearch includes a `netlify.toml` for the default deploy path:

```text
Build command: npm run build
Publish directory: .next
Node version: 22
```

Recommended flow:

1. Push this repository to GitHub.
2. In Netlify, choose **Add new site** -> **Import an existing project**.
3. Connect the GitHub repository.
4. Add optional environment variables from `.env.example`.
5. Deploy.

Because EzResearch uses Next.js API routes for research and PPTX generation, use a Git-connected Netlify deploy rather than dragging the folder into Netlify as a static site.

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev        # start local dev server
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm test           # Vitest unit tests
npm run build      # production build
```

## Testing

The test suite focuses on pure business logic:

- query generation
- request validation
- deduplication
- filtering
- scoring
- evidence table and brief generation
- deck slide generation
- expert synthesis fallback boundaries

Run:

```bash
npm test
```

## Screenshots

Planned additions after the next product pass:

- Premium landing page
- Scientist-image landing backdrop
- Slide-first output workspace
- PowerPoint export opened in Keynote/PowerPoint

The landing page uses a lightweight mix of local archival-style assets and web-hosted scientist imagery. Replace web-hosted references with licensed local assets before a commercial launch.

## Case Study

### Product Problem

Researchers, students, analysts, and operators often need a fast evidence scan, but scholarly search results are hard to convert into decision-ready artifacts. The risk is either manual overload or opaque summarization.

### Solution

EzResearch turns a topic into an auditable research package: source retrieval, filtering, scoring, citations, report, deck preview, and PPTX export. The product optimizes for trust over flash.

### Engineering Decisions

- Used Next.js App Router for a compact full-stack MVP.
- Kept LLM calls out of the first version so citation integrity is deterministic.
- Built scoring as transparent TypeScript rather than a black-box ranker.
- Preserved excluded records and warning states for auditability.
- Reused one structured, answer-first deck preview model for both UI preview and PPTX export.
- Added focused unit tests around the highest-risk pure logic.

## Future Improvements

- sharpen the results workspace into a more executive, report-first experience
- redesign generated reports and decks around answer-first consulting narratives
- add more README screenshots once the output page is polished
- Semantic Scholar, Crossref, Europe PMC, and Unpaywall connectors
- PDF/full-text parsing with section-aware extraction
- BibTeX/RIS export
- stronger claim clustering across multiple papers
- LLM synthesis behind a citation-audited service layer
- persistent project history with SQLite/Postgres/Supabase
- richer PPTX themes and chart/table slides
- browser-based report export to PDF

## Repo Hygiene

The project is ready to publish as a standalone GitHub repo. If this folder is not already a git repository:

```bash
git init
git add .
git commit -m "Initial EzResearch MVP"
```

Avoid committing `.env.local`, `.next/`, `node_modules/`, generated `.pptx` files, or local build artifacts.
