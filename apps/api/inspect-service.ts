import { FacebookService } from './src/facebook/facebook.service';

const mockPetition = { id: 'petition-1' } as any;
const mockUser = { id: 'test-token', trustScore: 75 } as any;
const prismaMock: any = {
  petition: {
    findUnique: async ({ where }: any) => {
      if (!where?.id || where.id !== mockPetition.id) {
        throw new Error(`petition.findUnique called with unexpected where: ${JSON.stringify(where)}`);
      }
      return mockPetition;
    },
  },
  user: {
    findUnique: async ({ where }: any) => {
      if (!where?.id || where.id !== mockUser.id) {
        throw new Error(`user.findUnique called with unexpected where: ${JSON.stringify(where)}`);
      }
      return mockUser;
    },
  },
  shareLink: {
    create: async ({ data }: any) => ({
      ...data,
      id: 'share-1',
      shortCode: 'abc12345',
      targetUrl: 'https://changelib.org/petitions/petition-1',
      petitionId: 'petition-1',
      source: 'facebook',
      medium: 'social',
      campaign: 'user_share',
      shareDialogUsed: true,
      clickCount: 0,
      conversions: 0,
      networkReachEstimate: 250,
      lastClickedAt: null,
    }),
    findUnique: async ({ where }: any) => {
      if (!where?.id && !where?.shortCode) {
        throw new Error(`shareLink.findUnique called with unexpected where: ${JSON.stringify(where)}`);
      }
      return null;
    },
    findMany: async () => [],
    update: async () => undefined,
    count: async () => 0,
    aggregate: async () => ({ _sum: { conversions: 0 } }),
  },
};
const eventBusMock: any = { publish: async () => {}, listen: async () => {} };
const svc = new FacebookService(prismaMock, eventBusMock);

svc.createFacebookShareLink('petition-1', 'test-token').then((result) => {
  console.log('result', result);
}).catch((err) => {
  console.error('error', err);
});
