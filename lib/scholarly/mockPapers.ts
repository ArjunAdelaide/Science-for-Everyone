import type { Paper } from "@/lib/types/paper";

export const mockPapers: Paper[] = [
  {
    id: "mock:crispr-lnp-2024",
    source: "mock",
    title: "Lipid nanoparticle strategies for in vivo CRISPR-Cas genome editing",
    authors: ["Maya Chen", "Ravi Patel", "Elena Morris"],
    journal: "Nature Biomedical Engineering",
    year: 2024,
    publicationDate: "2024-04-18",
    doi: "10.0000/ezresearch.mock.001",
    url: "https://example.org/mock-crispr-lnp",
    abstract:
      "Lipid nanoparticles are increasingly used for transient CRISPR-Cas delivery in liver and extrahepatic tissues. Optimisation of ionizable lipids, tissue targeting, and dose control remains central to improving efficacy and safety.",
    publicationTypes: ["journal article", "review"],
    citationCount: 58,
    likelyPeerReviewed: true,
    isPreprint: false
  },
  {
    id: "mock:crispr-aav-2023",
    source: "mock",
    title: "Adeno-associated viral vectors for CRISPR delivery: efficacy and safety trade-offs",
    authors: ["Sofia Laurent", "Daniel Kim"],
    journal: "Molecular Therapy",
    year: 2023,
    publicationDate: "2023-09-05",
    doi: "10.0000/ezresearch.mock.002",
    url: "https://example.org/mock-crispr-aav",
    abstract:
      "AAV vectors support durable delivery of genome editing components but face packaging, immunogenicity, and prolonged nuclease expression limitations. Split editor designs and tissue-specific promoters may reduce risk.",
    publicationTypes: ["journal article"],
    citationCount: 132,
    likelyPeerReviewed: true,
    isPreprint: false
  },
  {
    id: "mock:crispr-nonviral-2022",
    source: "mock",
    title: "Non-viral delivery platforms for therapeutic genome editing",
    authors: ["Hannah Okafor", "Luis Romero", "Priya Shah"],
    journal: "Annual Review of Biomedical Engineering",
    year: 2022,
    publicationDate: "2022-07-11",
    doi: "10.0000/ezresearch.mock.003",
    url: "https://example.org/mock-nonviral",
    abstract:
      "Non-viral CRISPR delivery platforms include lipid nanoparticles, polymers, peptides, and physical methods. These platforms can reduce integration and immunogenicity concerns but often struggle with tissue specificity and editing efficiency.",
    publicationTypes: ["review"],
    citationCount: 211,
    likelyPeerReviewed: true,
    isPreprint: false
  },
  {
    id: "mock:crispr-exvivo-2021",
    source: "mock",
    title: "Ex vivo CRISPR editing workflows for cell therapies",
    authors: ["Amelia Wright", "Noah Singh"],
    journal: "Cell Stem Cell",
    year: 2021,
    publicationDate: "2021-11-20",
    doi: "10.0000/ezresearch.mock.004",
    url: "https://example.org/mock-exvivo",
    abstract:
      "Ex vivo CRISPR workflows allow quality control before reinfusion and are prominent in hematopoietic and immune cell applications. Manufacturing complexity and scalability remain key limitations.",
    publicationTypes: ["journal article"],
    citationCount: 97,
    likelyPeerReviewed: true,
    isPreprint: false
  }
];
