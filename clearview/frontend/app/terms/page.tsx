import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          ← Back to home
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-2">Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: March 28, 2026</p>

        <div className="space-y-8 text-foreground">
          <section>
            <h2 className="text-xl font-bold mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By accessing or using Vera Fund (&ldquo;the Service&rdquo;), you agree to be bound by these Terms & Conditions. If you do not agree, do not use the Service. Vera Fund reserves the right to modify these terms at any time. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. Description of Service</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Vera Fund is an AI-powered personal finance platform that provides budgeting tools, spending analytics, virtual card management, purchase affordability analysis, and AI-driven financial advice. The Service is intended for informational and educational purposes only and does not constitute professional financial, tax, or investment advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. Account Registration</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You must provide accurate, complete, and current information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. You must be at least 18 years old to use Vera Fund. We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. Financial Data & Third-Party Connections</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Vera Fund may connect to your financial institutions through third-party providers such as Plaid. By linking your accounts, you authorize Vera Fund and its partners to access your financial data solely for the purpose of providing the Service. Vera Fund does not store your banking credentials. We are not responsible for the accuracy or availability of data provided by third-party institutions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. AI-Generated Advice Disclaimer</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The AI advisor (&ldquo;Vera&rdquo;) and purchase affordability analysis features use machine learning models to generate recommendations. These are automated suggestions and should not be treated as professional financial advice. Vera Fund is not a registered financial advisor, broker-dealer, or fiduciary. Always consult a qualified professional before making significant financial decisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. Virtual Cards</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Virtual cards issued through Vera Fund are subject to the terms of our card-issuing partner. Vera Fund may set spending limits, freeze, or close virtual cards at any time. Virtual cards are not FDIC-insured deposit accounts. Any funds loaded onto virtual cards are held by our banking partner.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">7. Prohibited Use</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You agree not to: (a) use the Service for any unlawful purpose; (b) attempt to reverse-engineer, decompile, or exploit the Service; (c) transmit malware or interfere with the Service&apos;s infrastructure; (d) impersonate another person; (e) use the Service to launder money or finance illegal activities; (f) scrape, crawl, or harvest data from the Service without written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">8. Limitation of Liability</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, Vera Fund and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability shall not exceed the amount you paid Vera Fund in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">9. Termination</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Either party may terminate this agreement at any time. Upon termination, your right to use the Service ceases immediately. Vera Fund may retain anonymized, aggregated data for analytics purposes. You may request deletion of your personal data by contacting privacy@verafund.app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">10. Governing Law</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              These Terms are governed by the laws of the State of Michigan, without regard to conflict-of-law principles. Any disputes shall be resolved through binding arbitration in Oakland County, Michigan, under the rules of the American Arbitration Association.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">11. Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For questions about these Terms, contact us at legal@verafund.app.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
