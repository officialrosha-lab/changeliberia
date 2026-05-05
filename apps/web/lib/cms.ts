import { getApiBase } from './api';

export interface CMSSection {
  id: string;
  label: string;
  html: string;
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

export function getSection(sections: CMSSection[] | null, id: string): string | null {
  if (!sections) return null;
  return sections.find((s) => s.id === id)?.html ?? null;
}
