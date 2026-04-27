import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Change Liberia',
  description: 'How Change Liberia collects, uses, and protects your personal information.',
};

const LAST_UPDATED = 'April 27, 2026';
const CONTACT_EMAIL = 'privacy@changelib.org';

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-3">
          Legal
        </p>
        <h1 className="font-serif text-4xl font-bold text-zinc-900 dark:text-neutral-50 sm:text-5xl mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-zinc-500 dark:text-neutral-400">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-10 text-zinc-700 dark:text-neutral-300 leading-relaxed">

        {/* Intro */}
        <section>
          <p>
            Change Liberia (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates{' '}
            <strong>changelib.org</strong>, a civic petition platform dedicated to empowering Liberians to raise
            issues, gather trusted community support, and drive real change. This Privacy Policy explains what
            personal information we collect, why we collect it, how we use and protect it, and the rights you have
            over your information.
          </p>
          <p className="mt-4">
            By using Change Liberia you agree to this policy. If you do not agree, please do not use the platform.
          </p>
        </section>

        <Divider />

        {/* 1 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">1. Information We Collect</h2>

          <h3 className="font-semibold text-zinc-800 dark:text-neutral-100 mb-2">a) Information you provide directly</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Account registration:</strong> full name, email address, and password (stored as a secure hash).</li>
            <li><strong>Profile details:</strong> county of residence, optional biography, and profile photo.</li>
            <li><strong>Petitions you create:</strong> title, description, category, target goal, and any supporting documents you upload.</li>
            <li><strong>Signatures:</strong> your name (or anonymous preference) and the date you signed.</li>
            <li><strong>Donations:</strong> donation amount and payment method details processed securely by Stripe. We never store raw card numbers.</li>
            <li><strong>Communications:</strong> messages you send to our support team or feedback forms.</li>
          </ul>

          <h3 className="font-semibold text-zinc-800 dark:text-neutral-100 mt-6 mb-2">b) Information collected automatically</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Log data:</strong> IP address, browser type, operating system, pages visited, and timestamps.</li>
            <li><strong>Device information:</strong> device identifiers and screen resolution to improve responsiveness.</li>
            <li><strong>Cookies and local storage:</strong> session tokens, theme preferences, and analytics identifiers (see Section 5).</li>
          </ul>

          <h3 className="font-semibold text-zinc-800 dark:text-neutral-100 mt-6 mb-2">c) Information from third parties</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Google OAuth:</strong> if you sign in with Google we receive your name, email, and profile photo from Google. We do not receive your Google password.</li>
          </ul>
        </section>

        <Divider />

        {/* 2 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Create and manage your account and authenticate you securely.</li>
            <li>Display your name on petitions you create or sign (unless you choose &ldquo;Anonymous&rdquo;).</li>
            <li>Send email notifications about petitions you have signed, milestones reached, or responses from officials — you may unsubscribe at any time.</li>
            <li>Process donations and issue receipts via Stripe.</li>
            <li>Detect and prevent fraud, abuse, and spam.</li>
            <li>Moderate content to ensure petitions comply with our community guidelines and Liberian law.</li>
            <li>Analyse aggregate, anonymised trends to improve the platform (e.g., which counties are most active).</li>
            <li>Comply with legal obligations.</li>
          </ul>
          <p className="mt-4 text-sm">
            We will never sell your personal data to advertisers or third parties.
          </p>
        </section>

        <Divider />

        {/* 3 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">3. Legal Basis for Processing</h2>
          <p className="text-sm">We process your data on the following legal grounds:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm mt-3">
            <li><strong>Contract performance:</strong> to provide the services you signed up for.</li>
            <li><strong>Legitimate interests:</strong> to improve the platform, prevent abuse, and ensure security.</li>
            <li><strong>Consent:</strong> for optional marketing emails (you may withdraw consent at any time).</li>
            <li><strong>Legal obligation:</strong> where required by applicable law.</li>
          </ul>
        </section>

        <Divider />

        {/* 4 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">4. How We Share Your Information</h2>
          <p className="text-sm">We share personal information only in the following limited circumstances:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm mt-3">
            <li>
              <strong>Service providers:</strong> we use trusted third-party vendors (Stripe for payments, Railway for cloud
              hosting, Vercel for web delivery) who process data solely on our behalf under data processing agreements.
            </li>
            <li>
              <strong>Public petition data:</strong> petition titles, descriptions, signature counts, and signer names (unless
              anonymous) are publicly visible as that is the nature of a civic petition platform.
            </li>
            <li>
              <strong>Government officials:</strong> petitions addressed to specific government bodies may be delivered to those
              officials as a core feature of the platform. Your name will appear on delivered petitions unless you signed
              anonymously.
            </li>
            <li>
              <strong>Legal requirements:</strong> we may disclose information if required by Liberian law, court order, or to
              protect the safety of our users or the public.
            </li>
            <li>
              <strong>Business transfers:</strong> in the event of a merger or acquisition your data would transfer to the new
              entity, which would be bound by this policy.
            </li>
          </ul>
        </section>

        <Divider />

        {/* 5 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">5. Cookies</h2>
          <p className="text-sm">We use the following types of cookies:</p>
          <div className="mt-4 overflow-x-auto">
            <table className="text-sm w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-neutral-700">
                  <th className="text-left py-2 pr-4 font-semibold text-zinc-900 dark:text-neutral-100">Cookie</th>
                  <th className="text-left py-2 pr-4 font-semibold text-zinc-900 dark:text-neutral-100">Purpose</th>
                  <th className="text-left py-2 font-semibold text-zinc-900 dark:text-neutral-100">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-neutral-800">
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">auth_token</td>
                  <td className="py-2 pr-4">Keeps you logged in</td>
                  <td className="py-2">7 days</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">theme</td>
                  <td className="py-2 pr-4">Remembers light/dark preference</td>
                  <td className="py-2">1 year</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">_fbp</td>
                  <td className="py-2 pr-4">Facebook pixel analytics</td>
                  <td className="py-2">90 days</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm">
            You can disable cookies in your browser settings, although some features (such as staying logged in) will
            not work without essential cookies.
          </p>
        </section>

        <Divider />

        {/* 6 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">6. Data Retention</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Account data is retained for as long as your account is active.</li>
            <li>Petition and signature records are retained for the lifetime of the platform as they form part of the
              civic record.</li>
            <li>Payment records are retained for 7 years as required for financial compliance.</li>
            <li>Server logs are deleted after 90 days.</li>
            <li>If you delete your account, your name will be replaced with &ldquo;Deleted User&rdquo; on petitions you signed;
              petition content you created may remain for the public record.</li>
          </ul>
        </section>

        <Divider />

        {/* 7 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">7. Security</h2>
          <p className="text-sm">
            We implement industry-standard security measures including TLS encryption in transit, bcrypt password
            hashing, JWT-based authentication, and Stripe&rsquo;s PCI-DSS-compliant payment infrastructure. Our
            servers are hosted on Railway with automated backups. Despite these measures, no internet service is
            completely secure — please use a strong, unique password and report any security concerns to{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-600 dark:text-emerald-400 underline">
              {CONTACT_EMAIL}
            </a>.
          </p>
        </section>

        <Divider />

        {/* 8 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">8. Children&rsquo;s Privacy</h2>
          <p className="text-sm">
            Change Liberia is not directed at children under 13. We do not knowingly collect personal information from
            anyone under 13. If you believe a child has provided us with personal information, contact us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-600 dark:text-emerald-400 underline">
              {CONTACT_EMAIL}
            </a>{' '}
            and we will delete it promptly.
          </p>
        </section>

        <Divider />

        {/* 9 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">9. Your Rights</h2>
          <p className="text-sm">You have the right to:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm mt-3">
            <li><strong>Access</strong> the personal data we hold about you.</li>
            <li><strong>Correct</strong> inaccurate data via your account settings or by contacting us.</li>
            <li><strong>Delete</strong> your account and associated personal data (subject to retention obligations above).</li>
            <li><strong>Object</strong> to processing for marketing purposes and withdraw consent at any time.</li>
            <li><strong>Data portability:</strong> request an export of your data in a machine-readable format.</li>
          </ul>
          <p className="mt-4 text-sm">
            To exercise any of these rights, email us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-600 dark:text-emerald-400 underline">
              {CONTACT_EMAIL}
            </a>. We will respond within 30 days.
          </p>
        </section>

        <Divider />

        {/* 10 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">10. International Transfers</h2>
          <p className="text-sm">
            Change Liberia is operated from Liberia, but our infrastructure providers (Railway, Vercel) may store data
            on servers in the United States or Europe. By using the platform you consent to this transfer. We ensure
            all providers maintain appropriate data protection standards.
          </p>
        </section>

        <Divider />

        {/* 11 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">11. Changes to This Policy</h2>
          <p className="text-sm">
            We may update this Privacy Policy from time to time. When we do, we will revise the &ldquo;Last updated&rdquo;
            date above and, for material changes, notify you by email or via a banner on the platform. Your continued
            use of Change Liberia after a policy update constitutes acceptance of the revised policy.
          </p>
        </section>

        <Divider />

        {/* 12 */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-50 mb-4">12. Contact Us</h2>
          <p className="text-sm">
            If you have questions about this Privacy Policy or your data, please contact:
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
          <Link href="/terms" className="text-emerald-600 dark:text-emerald-400 hover:underline">
            Terms of Service
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
