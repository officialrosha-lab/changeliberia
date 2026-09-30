import { StudioClient } from './studio-client';

export const metadata = {
  title: 'Change Liberia Studio | Change Liberia',
  description: 'Request professional services — campaign strategy, data work, or custom civic tooling.',
  alternates: { canonical: '/studio' },
};

export default function StudioPage() {
  return <StudioClient />;
}
