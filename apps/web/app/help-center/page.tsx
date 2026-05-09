import type { Metadata } from 'next';
import { SiteFooter } from '../../components/site-footer';
import { CMSBlockRenderer } from '../../components/cms-block-renderer';
import { fetchCmsPageWithBlocks } from '../../lib/cms';

export const metadata: Metadata = {
  title: 'Help Center — Change Liberia',
  description: 'Find answers to common questions about creating petitions, signing, verification, and using the Change Liberia platform.',
};

export default async function HelpCenterPage() {
  const page = await fetchCmsPageWithBlocks('help-center');

  if (!page) {
    return (
      <>
        <main className="min-h-screen bg-white dark:bg-neutral-950">
          <section className="border-b border-zinc-200 bg-gradient-to-br from-emerald-50 to-white px-4 py-16 dark:border-neutral-800 dark:from-emerald-950/20 dark:to-neutral-900 sm:py-20 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
                Help Center
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">
                Loading...
              </p>
            </div>
          </section>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-white dark:bg-neutral-950">
        {page.blocks && page.blocks.length > 0 ? (
          page.blocks.map((block) => (
            <CMSBlockRenderer key={block.id} block={block} />
          ))
        ) : (
          <section className="border-b border-zinc-200 bg-gradient-to-br from-emerald-50 to-white px-4 py-16 dark:border-neutral-800 dark:from-emerald-950/20 dark:to-neutral-900 sm:py-20 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
                {page.title}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">
                No content available
              </p>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
