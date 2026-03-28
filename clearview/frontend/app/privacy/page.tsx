import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          ← Back to home
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: March 28, 2026</p>

        <div className="space-y-8 text-foreground">
          <section>
            <h2 className="text-xl font-bold mb-3">1. Information We Collect</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              We collect information you provide directly: name, email address, financial goals, and account preferences. When you connect financial accounts through Plaid, we receive transaction history, account balances, and institution details. We do not receive or store your banking passwords.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We automatically collect device information (browser type, OS, IP address), usage data (pages visited, features used, session duration), and cookies for authentication and analytics.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground leading-relaxed space-y-2">
              <li>Provide and improve the Vera Fund platform and its features</li>
              <li>Generate personalized financial insights, budgets, and recommendations</li>
              <li>Power the AI advisor (Vera) and purchase affordability analysis</li>
              <li>Process transactions and manage virtual cards</li>
              <li>Send account notifications, security alerts, and product updates</li>
              <li>Detect and prevent fraud, abuse, and unauthorized access</li>
              <li>Comply with legal obligations and respond to lawful requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. Data Sharing</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We do not sell your personal data. We share data only with: (a) service providers who process data on our behalf (Plaid for bank connections, cloud infrastructure providers, analytics tools); (b) card-issuing partners for virtual card functionality; (c) law enforcement when required by valid legal process. All third-party providers are contractually bound to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. Data Security</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use industry-standard encryption (AES-256 at rest, TLS 1.3 in transit) to protect your data. Access to personal data is restricted to authorized personnel on a need-to-know basis. We conduct regular security audits and penetration testing. Despite these measures, no system is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Data Retention</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We retain your data for as long as your account is active or as needed to provide the Service. Financial transaction data is retained for 7 years to comply with regulatory requirements. After account deletion, personal data is purged within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. Your Rights</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You have the right to: (a) access your personal data; (b) correct inaccurate data; (c) request deletion of your data; (d) export your data in a portable format; (e) opt out of marketing communications; (f) withdraw consent for data processing. To exercise these rights, email privacy@verafund.app. We respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">7. Cookies & Tracking</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use essential cookies for authentication and session management. We use analytics cookies (anonymized) to understand how users interact with the platform. We do not use advertising trackers. You can disable non-essential cookies in your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">8. Children&apos;s Privacy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Vera Fund is not intended for users under 18 years of age. We do not knowingly collect data from minors. If we learn that we have collected data from a user under 18, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">9. Changes to This Policy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may update this Privacy Policy periodically. We will notify you of material changes via email or in-app notification at least 30 days before they take effect. Your continued use of the Service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">10. Contact Us</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For privacy-related inquiries, contact our Data Protection Officer at privacy@verafund.app or write to: Vera Fund Inc., Oakland University, Rochester, MI 48309.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
