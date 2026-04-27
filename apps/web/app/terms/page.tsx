import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — Change Liberia',
  description: 'The terms and conditions governing your use of Change Liberia.',
};

const LAST_UPDATED = 'April 27, 2026';
const CONTACT_EMAIL = 'legal@changelib.org';

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-3">
          Legal
        </p>
        <h1 className="font-serif text-4xl font-bold text-zinc-900 dark:text-neutral-50 sm:text-5xl mb-4">
          Terms of Service
        </h1>
        <p className="text-sm text-zinc-500 dark:text-neutral-400">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-10 text-zinc-700 dark:text-neutral-300 leading-relaxed">

        {/* Intro */}
        <section>
          <p>
            Welcome to <strong>Change Liberia</strong>. By accessing or using changelib.org (the &ldquo;Platform&rdquo;) you
            agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). Please read them carefully. If you do not
            agree to all of these Terms, do not use the Platform.
          </p>
          <p className="mt-4">
            Change Liberia is a civic petition platform that enables Liberians to create, sign, and share
            petitions addressed to public officials, institutions, and organisations operating in or affecting
            Liberia.
          </p>
        </section>

        <Divider />

        {/* 1 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">1. Eligibility</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>You must be at least 13 years old to use Change Liberia.</li>
            <li>
              By creating an account you represent that you are at least 13 and that all information you provide is
              accurate and truthful.
            </li>
            <li>
              Verified Liberian status (the blue badge) is available only to individuals who can confirm Liberian
              citizenship or lawful residency. Providing false documentation to obtain verification is a violation of
              these Terms and may be reported to authorities.
            </li>
          </ul>
        </section>

        <Divider />

        {/* 2 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">2. Your Account</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>You are responsible for maintaining the confidentiality of your password and for all activity that occurs under your account.</li>
            <li>Notify us immediately at <a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-600 dark:text-emerald-400 underline">{CONTACT_EMAIL}</a> if you suspect unauthorised access.</li>
            <li>You may not share your account or allow others to use it.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
          </ul>
        </section>

        <Divider />

        {/* 3 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">3. Petitions and Content</h2>

          <h3 className="font-semibold text-zinc-800 dark:text-neutral-100 mb-2">a) What you may petition for</h3>
          <p className="text-sm">
            Petitions must be directed at a legitimate civic, social, environmental, or governmental concern
            relating to Liberia or affecting Liberians. Examples include road infrastructure, education access,
            healthcare, environmental protection, and government accountability.
          </p>

          <h3 className="font-semibold text-zinc-800 dark:text-neutral-100 mt-5 mb-2">b) Prohibited content</h3>
          <p className="text-sm">You may not create or sign petitions that:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm mt-2">
            <li>Incite violence, hatred, or discrimination based on ethnicity, religion, gender, political opinion, or disability.</li>
            <li>Contain false, defamatory, or misleading information about any person or organisation.</li>
            <li>Promote or facilitate illegal activity under Liberian law.</li>
            <li>Infringe the intellectual property rights of others.</li>
            <li>Constitute harassment, stalking, or threats directed at any individual.</li>
            <li>Advocate for the overthrow of a constitutionally established government.</li>
            <li>Solicit money outside the Platform&rsquo;s official donation feature.</li>
            <li>Contain sexually explicit material.</li>
            <li>Are designed to manipulate signature counts through bots, fake accounts, or coordinated inauthentic behaviour.</li>
          </ul>

          <h3 className="font-semibold text-zinc-800 dark:text-neutral-100 mt-5 mb-2">c) Moderation</h3>
          <p className="text-sm">
            Change Liberia moderators review all petitions before publication. We may reject, remove, or suspend
            petitions that violate these Terms or our community guidelines at any time without prior notice. We will
            notify the petition creator by email with the reason where possible.
          </p>
        </section>

        <Divider />

        {/* 4 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">4. Your Content — Licence to Us</h2>
          <p className="text-sm">
            By submitting a petition, comment, or other content to Change Liberia, you grant us a worldwide,
            royalty-free, non-exclusive licence to host, reproduce, display, and distribute that content for the
            purpose of operating the Platform — including delivering petitions to their intended recipients and
            publishing media coverage.
          </p>
          <p className="mt-4 text-sm">
            You retain ownership of your content. You represent that you have the right to grant this licence and
            that your content does not violate any third-party rights.
          </p>
        </section>

        <Divider />

        {/* 5 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">5. Signatures</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Each person may sign a petition once. Duplicate signatures are automatically removed.</li>
            <li>
              Signing a petition is a civic expression of support. Change Liberia does not guarantee that any
              petition will result in a government response or policy change.
            </li>
            <li>
              You may sign as &ldquo;Anonymous&rdquo; if you prefer your name not to be publicly displayed. Your
              account will still be associated with the signature in our database for integrity purposes.
            </li>
          </ul>
        </section>

        <Divider />

        {/* 6 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">6. Donations</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Donations support the operation of the Change Liberia platform, not individual petitions.</li>
            <li>Payments are processed by Stripe. Change Liberia does not store your card details.</li>
            <li>Donations are generally non-refundable. Contact us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-600 dark:text-emerald-400 underline">{CONTACT_EMAIL}</a> within 14 days if you believe a charge was made in error.</li>
            <li>Change Liberia is not a registered charity. Donations are not tax-deductible.</li>
          </ul>
        </section>

        <Divider />

        {/* 7 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">7. Prohibited Conduct</h2>
          <p className="text-sm">When using Change Liberia you agree not to:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm mt-3">
            <li>Attempt to gain unauthorised access to any part of the Platform or any connected system.</li>
            <li>Scrape, crawl, or data-mine the Platform without written permission.</li>
            <li>Use automated tools to create accounts, sign petitions, or simulate human activity.</li>
            <li>Interfere with the Platform&rsquo;s infrastructure, including denial-of-service attacks.</li>
            <li>Impersonate any person, organisation, or government body.</li>
            <li>Use the Platform to send unsolicited commercial communications (spam).</li>
          </ul>
        </section>

        <Divider />

        {/* 8 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">8. Intellectual Property</h2>
          <p className="text-sm">
            The Change Liberia name, logo, and original software are owned by Change Liberia and protected by
            applicable intellectual property laws. You may not reproduce or distribute our branding without written
            permission. User-submitted petition content remains the intellectual property of the creator.
          </p>
        </section>

        <Divider />

        {/* 9 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">9. Disclaimers</h2>
          <p className="text-sm">
            Change Liberia is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee that:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm mt-3">
            <li>The Platform will be available at all times or free from errors.</li>
            <li>Any petition will be read, acknowledged, or acted upon by its intended recipient.</li>
            <li>Information on the Platform is accurate, complete, or up to date.</li>
          </ul>
        </section>

        <Divider />

        {/* 10 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">10. Limitation of Liability</h2>
          <p className="text-sm">
            To the maximum extent permitted by applicable Liberian law, Change Liberia and its operators shall not
            be liable for any indirect, incidental, special, consequential, or punitive damages arising from your
            use of the Platform or any content posted on it, even if we have been advised of the possibility of such
            damages. Our total liability to you for any claim shall not exceed the amount you paid us in the 12
            months preceding the claim, or USD 10, whichever is greater.
          </p>
        </section>

        <Divider />

        {/* 11 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">11. Indemnification</h2>
          <p className="text-sm">
            You agree to indemnify and hold harmless Change Liberia, its operators, moderators, and affiliates from
            any claim, damages, or expenses (including reasonable legal fees) arising from your use of the Platform,
            your content, or your violation of these Terms.
          </p>
        </section>

        <Divider />

        {/* 12 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">12. Termination</h2>
          <p className="text-sm">
            We may suspend or permanently terminate your access to Change Liberia at any time for violations of
            these Terms, without prior notice. You may close your account at any time via your account settings.
            Sections 4, 9, 10, 11, and 13 survive termination.
          </p>
        </section>

        <Divider />

        {/* 13 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">13. Governing Law &amp; Disputes</h2>
          <p className="text-sm">
            These Terms are governed by the laws of the Republic of Liberia. Any dispute arising from these Terms or
            your use of the Platform shall first be addressed by contacting us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-600 dark:text-emerald-400 underline">
              {CONTACT_EMAIL}
            </a>{' '}
            and attempting to resolve the matter informally within 30 days. If unresolved, disputes shall be subject
            to the jurisdiction of the courts of Montserrado County, Liberia.
          </p>
        </section>

        <Divider />

        {/* 14 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">14. Changes to These Terms</h2>
          <p className="text-sm">
            We may update these Terms from time to time. We will notify you of material changes by email or via a
            notice on the Platform at least 14 days before the change takes effect. Continued use of the Platform
            after changes take effect constitutes acceptance of the revised Terms. If you do not agree to the
            revised Terms, you may close your account before the effective date.
          </p>
        </section>

        <Divider />

        {/* 15 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">15. Contact</h2>
          <p className="text-sm">
            Questions about these Terms? Reach us at:
          </p>
          <address className="not-italic mt-3 text-sm space-y-1">
            <p><strong className="text-zinc-900 dark:text-neutral-50">Change Liberia</strong></p>
            <p>Monrovia, Liberia</p>
            <p>
              Email:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-600 dark:text-emerald-400 underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </address>
        </section>

        <Divider />

        {/* Footer nav */}
        <div className="flex flex-wrap gap-4 text-sm pt-2">
          <Link href="/privacy" className="text-emerald-600 dark:text-emerald-400 hover:underline">
            Privacy Policy
          </Link>
          <Link href="/" className="text-zinc-500 dark:text-neutral-400 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

function Divider() {
  return <hr className="border-zinc-100 dark:border-neutral-800" />;
}
