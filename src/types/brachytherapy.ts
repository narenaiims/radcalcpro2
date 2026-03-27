export interface Subsection {
  id: string;
  title: string;
  body: string;
}

export interface Section {
  id: string;
  icon: any; // Lucide icon
  title: string;
  color?: string;
  subs: Subsection[];
}

export interface SiteKnowledgeBase {
  [siteId: string]: Section[];
}

export interface SiteConfig {
  id: string;
  label: string;
  icon: any;
  primary: string;
  bg: string;
  border: string;
}
