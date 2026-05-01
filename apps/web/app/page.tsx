import { HomeContributeBanner } from '../components/home-contribute-banner';
import { HomeDonationSection } from '../components/home-donation-section';
import { HomeDiscoverGrid } from '../components/home-discover-grid';
import { HomeDraftCta } from '../components/home-draft-cta';
import { HomeFeaturedStory } from '../components/home-featured-story';
import { HomeHero } from '../components/home-hero';
import { HomeHowItWorks } from '../components/home-how-it-works';
import { HomeSocialProof } from '../components/home-social-proof';
import { PulseMap } from '../components/pulse-map';
import { SiteFooter } from '../components/site-footer';
import { SponsorsSection } from '../components/sponsors-section';
import { apiGet } from '../lib/api';

type Petition = {
  id: string;
  title: string;
  summary: string;
  signaturesCount: number;
  todaySignatures: number;
  imageUrl?: string | null;
};

type PetitionStats = {
  totalPetitions: number;
  totalSignatures: number;
  campaignsWon: number;
  countiesReached: number;
};

export default async function Home() {
  const [trending, list, stats] = await Promise.all([
    apiGet<Petition[]>('/petitions/trending').catch(() => []),
    apiGet<Petition[]>('/petitions').catch(() => []),
    apiGet<PetitionStats>('/petitions/stats').catch(() => null),
  ]);

  const byId = new Map<string, Petition>();
  for (const p of [...trending, ...list]) {
    byId.set(p.id, p);
  }
  const petitions = Array.from(byId.values());
  const featured = trending[0];

  return (
    <>
      <div className="relative">
        <PulseMap />
        <HomeHero />
      </div>
      <HomeSocialProof stats={stats} />
      {featured ? <HomeFeaturedStory petition={featured} /> : null}
      <HomeHowItWorks />
      <HomeDiscoverGrid petitions={petitions} />
      <HomeDonationSection />
      <HomeDraftCta />
      <HomeContributeBanner />
      <SponsorsSection />
      <SiteFooter />
    </>
  );
}
