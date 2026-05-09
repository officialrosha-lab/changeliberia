import { getApiBase } from './api';

export interface CMSSection {
  id: string;
  label: string;
  html: string;
}

export interface CMSBlock {
  id: string;
  pageId: string;
  type: string;
  order: number;
  props: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CMSPage {
  id: string;
  title: string;
  slug: string;
  content?: string;
  blocks?: CMSBlock[];
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  published: boolean;
  publishedAt?: string;
  viewCount: number;
}

export async function fetchCmsPage(slug: string): Promise<CMSSection[] | null> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/cms/public/pages/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const page = await res.json();
    if (!page?.content) return null;
    const sections = JSON.parse(page.content);
    if (!Array.isArray(sections)) return null;
    return sections as CMSSection[];
  } catch {
    return null;
  }
}

export async function fetchCmsPageWithBlocks(slug: string): Promise<CMSPage | null> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/cms/public/pages/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const page = await res.json();
    if (!page) return null;
    
    // Parse blocks if they exist and are stored as JSON string
    if (page.blocks && typeof page.blocks === 'string') {
      try {
        page.blocks = JSON.parse(page.blocks);
      } catch {
        page.blocks = [];
      }
    }
    
    return page as CMSPage;
  } catch {
    return null;
  }
}

export function getSection(sections: CMSSection[] | null, id: string): string | null {
  if (!sections) return null;
  return sections.find((s) => s.id === id)?.html ?? null;
}
