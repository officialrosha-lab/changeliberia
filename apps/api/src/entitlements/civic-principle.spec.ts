import 'reflect-metadata';
import { PetitionsController } from '../petitions/petitions.controller';
import { SignaturesController } from '../signatures/signatures.controller';
import { PollsController } from '../polls/polls.controller';
import { VotingController } from '../polls/voting.controller';
import { OfficialsController } from '../officials/officials.controller';
import { REQUIRES_ENTITLEMENT_KEY } from './decorators/requires-entitlement.decorator';

/**
 * The automated backstop for this platform's single non-negotiable
 * constraint: creating/signing/following/viewing a petition, participating
 * in or viewing Civic Pulse, and a verified lawmaker's basic constituency
 * access must never be paywalled. No payment or entitlement check can ever
 * sit in front of these routes.
 *
 * This is a static/reflection check, not an HTTP one — it fails the moment
 * `@RequiresEntitlement(...)` metadata appears on any of these handlers,
 * which is the earliest possible point to catch a civic-principle
 * violation (before the route is even exercised). Keep this file a CI
 * merge gate: any change here should be treated as a decision that needs
 * explicit product sign-off, not a routine test update.
 */
function expectNoEntitlementGate(
  controller: { prototype: object },
  methodName: string,
) {
  const method = (controller.prototype as Record<string, unknown>)[
    methodName
  ] as object | undefined;
  expect(method).toBeDefined();
  const metadata: unknown = Reflect.getMetadata(
    REQUIRES_ENTITLEMENT_KEY,
    method!,
  );
  expect(metadata).toBeUndefined();
}

describe('Civic principle: free-forever routes carry no EntitlementGuard', () => {
  it('petition create/list/view/follow routes are never entitlement-gated', () => {
    expectNoEntitlementGate(PetitionsController, 'list');
    expectNoEntitlementGate(PetitionsController, 'one');
    expectNoEntitlementGate(PetitionsController, 'create');
    expectNoEntitlementGate(PetitionsController, 'follow');
    expectNoEntitlementGate(PetitionsController, 'checkFollow');
  });

  it('signing a petition is never entitlement-gated', () => {
    expectNoEntitlementGate(SignaturesController, 'create');
    expectNoEntitlementGate(SignaturesController, 'hasSigned');
  });

  it('Civic Pulse list/view/results/vote routes are never entitlement-gated', () => {
    expectNoEntitlementGate(PollsController, 'listPolls');
    expectNoEntitlementGate(PollsController, 'getPoll');
    expectNoEntitlementGate(PollsController, 'getPollBySlug');
    expectNoEntitlementGate(PollsController, 'getPollResults');
    expectNoEntitlementGate(VotingController, 'castVote');
  });

  it("a verified lawmaker's basic constituency routes are never entitlement-gated", () => {
    expectNoEntitlementGate(OfficialsController, 'getConstituency');
    expectNoEntitlementGate(OfficialsController, 'getConstituencyPetitions');
    expectNoEntitlementGate(OfficialsController, 'getConstituencyPolls');
    expectNoEntitlementGate(OfficialsController, 'getConstituencyIssues');
    expectNoEntitlementGate(OfficialsController, 'getDashboard');
    expectNoEntitlementGate(OfficialsController, 'getFeed');
    expectNoEntitlementGate(OfficialsController, 'getInbox');
    // Constituency reports (Milestone 5) are explicitly "free for every
    // verified official, permanently" per official-reports-panel.tsx's own
    // banner copy — the basic report pipeline must stay ungated too.
    expectNoEntitlementGate(OfficialsController, 'listReports');
    expectNoEntitlementGate(OfficialsController, 'generateReport');
    expectNoEntitlementGate(OfficialsController, 'downloadReport');
  });
});
