import { EventsClient } from './events-client';

export const metadata = {
  title: 'Events | Change Liberia',
  description: 'Workshops, briefings, and convenings from Change Liberia — some free, some ticketed.',
  alternates: { canonical: '/events' },
};

export default function EventsPage() {
  return <EventsClient />;
}
