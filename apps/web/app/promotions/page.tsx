import { PromotionsClient } from './promotions-client';

export const metadata = {
  title: 'My Promotions | Change Liberia',
  description: 'Track the petitions you’ve paid to promote.',
  alternates: { canonical: '/promotions' },
  robots: { index: false, follow: false },
};

export default function PromotionsPage() {
  return <PromotionsClient />;
}
