export interface Presentation {
  id: string;
  title: string;
  summary: string;
  theme: string;
  tags: string[];
  createdAt: string;
  contributor: string;
  slideCount: number;
  slideHtml?: string;
  externalUrl?: string;
}

export type WizardStep = "topic" | "style" | "generate";

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  previewBg: string;
  accentColor: string;
}
