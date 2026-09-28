import type { Metadata } from 'next';
import { SiteFooter } from '../../components/site-footer';
import { CMSBlockRenderer } from '../../components/cms-block-renderer';
import { fetchCmsPageWithBlocks } from '../../lib/cms';

export const metadata: Metadata = {
  title: 'How It Works — Change Liberia',
  description: 'A step-by-step guide to creating a petition, building support, and reaching decision-makers on Change Liberia.',
  alternates: { canonical: '/how-it-works' },
};

export default async function HowItWorksPage() {
  const page = await fetchCmsPageWithBlocks('how-it-works');

  if (!page) {
    return (
      <>
        <main className="min-h-screen bg-white dark:bg-neutral-950">
          <section className="border-b border-zinc-200 bg-gradient-to-br from-emerald-50 to-white px-4 py-16 dark:border-neutral-800 dark:from-emerald-950/20 dark:to-neutral-900 sm:py-20 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
                How It Works
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">
                We couldn't load this page right now. Please refresh, or reach us at{' '}
                <a href="mailto:hello@changeliberia.org" className="font-semibold text-emerald-600 underline dark:text-emerald-400">
                  hello@changeliberia.org
                </a>
                .
              </p>
            </div>
          </section>
        </main>
        <SiteFooter />
      </>
    );
  }

  const stepBlock = (page.blocks ?? []).find((block) => block.type === 'grid');
  const steps = (stepBlock?.props?.items ?? []) as Array<{ title: string; description: string }>;
  const howToJsonLd =
    steps.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'How to start a petition on Change Liberia',
          description: page.metaDescription || 'A step-by-step guide to creating a petition on Change Liberia.',
          step: steps.map((s) => ({
            '@type': 'HowToStep',
            name: s.title,
            text: s.description,
          })),
        }
      : null;

  const faqItems = (page.blocks ?? [])
    .filter((block) => block.type === 'faq')
    .flatMap((block) => (block.props?.items ?? []) as Array<{ q: string; a: string }>);
  const faqJsonLd =
    faqItems.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
          })),
        }
      : null;

  const jsonLdBlocks = [howToJsonLd, faqJsonLd].filter(Boolean);

  return (
    <>
      {jsonLdBlocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block).replace(/<\/script>/gi, '<\\/script>') }}
        />
      ))}
      <main className="min-h-screen bg-white dark:bg-neutral-950">
        {page.blocks && page.blocks.length > 0 ? (
          <>
            {!page.blocks.some((block) => block.type === 'hero') && (
              <h1 className="sr-only">{page.title}</h1>
            )}
            {page.blocks.map((block) => (
              <CMSBlockRenderer key={block.id} block={block} />
            ))}
          </>
        ) : (
          <section className="border-b border-zinc-200 bg-gradient-to-br from-emerald-50 to-white px-4 py-16 dark:border-neutral-800 dark:from-emerald-950/20 dark:to-neutral-900 sm:py-20 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
                {page.title}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">
                This page is being updated. Check back soon, or reach us at{' '}
                <a href="mailto:hello@changeliberia.org" className="font-semibold text-emerald-600 underline dark:text-emerald-400">
                  hello@changeliberia.org
                </a>
                .
              </p>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
