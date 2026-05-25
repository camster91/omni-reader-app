export interface DigestItem {
  title: string;
  link: string;
  source: string;
  _cat?: string;
}

export type Digest = Record<string, DigestItem[]>;

export const categories = [
  "News",
  "Tech",
  "AI/ML",
  "Social",
  "Dev",
  "Freelance",
] as const;
