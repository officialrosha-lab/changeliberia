/**
 * One-off backfill: swaps the stock Unsplash office-photo background used
 * behind the About / How It Works / Help Center hero sections (and their
 * ogImage) for the new illustrated "Your Petition" banner now checked in
 * at apps/web/public/illustrations/petition-voice-banner.jpg.
 *
 * Matches by the exact old URL rather than by slug, so it's safe to re-run:
 * a row that's already been swapped, or one an admin has since edited to
 * something else entirely, is left untouched.
 *
 * Run: npx tsx src/scripts/backfill-hero-banner-image.ts
 * Not wired into any Nest module or the app's own seed/start scripts — a
 * deliberate one-time migration step, run manually per environment, same
 * convention as backfill-decimal-amounts.ts.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OLD_IMAGE_URL =
  'https://images.unsplash.com/photo-1552664730-d307ca884978';
const NEW_IMAGE_URL = '/illustrations/petition-voice-banner.jpg';

async function main() {
  console.log('Backfilling hero banner image...\n');

  const pageResult = await prisma.cMSPage.updateMany({
    where: { ogImage: OLD_IMAGE_URL },
    data: { ogImage: NEW_IMAGE_URL },
  });
  console.log(`CMSPage.ogImage: updated ${pageResult.count} row(s)`);

  const blocks = await prisma.cMSBlock.findMany({
    where: { type: 'hero', props: { contains: OLD_IMAGE_URL } },
  });

  let blockCount = 0;
  for (const block of blocks) {
    const props = JSON.parse(block.props) as Record<string, unknown>;
    if (props.backgroundImage !== OLD_IMAGE_URL) continue;
    props.backgroundImage = NEW_IMAGE_URL;
    await prisma.cMSBlock.update({
      where: { id: block.id },
      data: { props: JSON.stringify(props) },
    });
    blockCount += 1;
  }
  console.log(`CMSBlock.props.backgroundImage: updated ${blockCount} row(s)`);

  console.log('\nBackfill complete.');
}

if (require.main === module) {
  main()
    .catch((err: unknown) => {
      console.error(
        'Backfill failed:',
        err instanceof Error ? err.message : err,
      );
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
