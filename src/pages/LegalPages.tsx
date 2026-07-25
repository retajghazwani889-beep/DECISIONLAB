import React from 'react';
import { Shield, FileText, Mail } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// LegalPages — Privacy Policy and Terms of Service.
// Written in plain language. Covers accounts, roles, content, payments
// (Paddle as merchant of record), cancellations, refunds, and liability.
// ─────────────────────────────────────────────────────────────────────────────

const CONTACT = 'info@decisionlabhub.com';
const SUPPORT = 'support@decisionlabhub.com';
const UPDATED = 'July 2026';

function LegalShell({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
            <Icon size={24} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight font-display mb-3">{title}</h1>
          <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Last updated: {UPDATED}</p>
        </div>
        <div className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8 sm:p-12 space-y-8">
          {children}
        </div>
        <p className="text-center text-xs text-brand-text-muted font-medium mt-8 flex items-center justify-center gap-2">
          <Mail size={13} className="text-brand-accent" /> Questions? <a href={`mailto:${CONTACT}`} className="text-brand-accent font-bold hover:underline">{CONTACT}</a>
        </p>
      </div>
    </div>
  );
}

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-sm font-black uppercase tracking-tight font-display text-brand-text-primary">{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-brand-text-secondary font-medium leading-relaxed mt-2">{children}</p>
);

export function PrivacyPolicyPage() {
  return (
    <LegalShell icon={Shield} title="Privacy Policy">
      <div><H>Who we are</H>
        <P>DecisionLab ("we", "us") operates decisionlabhub.com — a platform for startup validation, pitch preparation, team building, and founder–investor matching. This policy explains what information we collect, why, and the choices you have. By using DecisionLab you agree to this policy.</P></div>

      <div><H>Information we collect</H>
        <P>Account information: your name, email address, country, and password (passwords are handled by our authentication provider and are never visible to us). If you sign in with Google, we receive your name, email, and profile photo from Google.</P>
        <P>Content you provide: your profile details (bio, links, phone, city, CV), your startup information (ideas, descriptions, documents, pitch decks), positions you post, applications you send, and messages sent through our contact form.</P>
        <P>Usage information: basic technical data needed to run the service, such as login times and the actions you take in the product.</P></div>

      <div><H>How we use your information</H>
        <P>To operate DecisionLab: creating and securing your account, generating startup analyses and reports, powering team recruitment and applications, matching founders with investors, processing subscriptions, and responding when you contact us. We also use it to fix problems and improve the product.</P></div>

      <div><H>Who can see your information</H>
        <P>You control your profile's visibility with the privacy setting (Public, Investors Only, Connections Only, Private). Startups you explicitly share or submit to the investor network become visible to investor accounts. When you apply to a position, your profile and CV are shared with that founder. When a founder accepts an applicant, the founder's contact details are shared with the applicant. We never make your private content visible outside these product features.</P></div>

      <div><H>Payments</H>
        <P>Paid subscriptions are processed by Paddle.com, which acts as the merchant of record. Your card or payment details are entered directly with Paddle and never touch our servers or database. Paddle shares with us only what we need to activate your plan: the plan purchased, the subscription status, and a customer reference. Paddle's own privacy policy applies to the payment itself.</P></div>

      <div><H>Where your data lives</H>
        <P>Your data is stored with Google Firebase (Google Cloud). Our email and contact-form providers process messages you send us. We use these established providers rather than running our own servers for your data.</P></div>

      <div><H>What we don't do</H>
        <P>We do not sell your personal information. We do not show third-party advertising. We do not share your data with anyone except as described above or where the law requires it.</P></div>

      <div><H>Your choices & deletion</H>
        <P>You can edit your profile and privacy settings at any time. You can delete your account from Account Settings, which removes your login, profile, startups, analyses, positions, and applications. For any data question or request, email <a href={`mailto:${CONTACT}`} className="text-brand-accent font-bold hover:underline">{CONTACT}</a> and we will help.</P></div>

      <div><H>Age requirement</H>
        <P>DecisionLab is not directed at children under 16. If you believe a child has created an account, contact us and we will remove it.</P></div>

      <div><H>Changes to this policy</H>
        <P>If we make material changes, we will update the date above and announce the change in the product. Continued use after a change means you accept the updated policy.</P></div>
    </LegalShell>
  );
}

export function TermsOfServicePage() {
  return (
    <LegalShell icon={FileText} title="Terms of Service">
      <div><H>Agreement</H>
        <P>These terms are an agreement between you and DecisionLab, the operator of decisionlabhub.com. By creating an account or using the service you accept these terms. If you do not agree, please do not use DecisionLab.</P></div>

      <div><H>The service</H>
        <P>DecisionLab provides startup validation and analysis tools, pitch preparation, team building (TeamLab), and matching between founders, investors, and team members. Some parts of the service are in active development: features may change, be added, or be removed as the product evolves.</P></div>

      <div><H>Accounts & roles</H>
        <P>You must provide accurate information and keep your login secure — you are responsible for activity on your account. Accounts come in roles (founder, investor, team member); each account belongs to one person. Accounts used for spam, impersonation, harassment, scraping, or any unlawful purpose may be suspended or removed.</P></div>

      <div><H>Your content</H>
        <P>You own what you upload — your startup information, documents, pitch decks, CV, and profile. You give us permission to store and display that content as needed to run the product's features, including showing it to the specific people you choose to share it with (for example, submitting a startup to the investor network, or applying to a founder's position). You are responsible for having the rights to anything you upload.</P></div>

      <div><H>Subscriptions & billing</H>
        <P>Paid plans, prices, and included features are shown on the pricing page. Subscriptions are billed monthly through Paddle.com, our merchant of record — Paddle handles the payment, applicable taxes, and billing security. Your subscription renews automatically each billing period until cancelled.</P></div>

      <div><H>Cancellation</H>
        <P>You can cancel anytime from your Billing page. Cancellation takes effect at the end of the billing period you have already paid for: you keep your plan's features until that date, and no further charges are made afterwards. Your account and content remain — you simply move to the free plan.</P></div>

      <div><H>Refunds</H>
        <P>If something went wrong with a charge — for example a billing error or a duplicate payment — contact <a href={`mailto:${SUPPORT}`} className="text-brand-accent font-bold hover:underline">{SUPPORT}</a> within 14 days of the charge and we will review it fairly. Refunds, where approved, are issued through Paddle to the original payment method.</P></div>

      <div><H>Not professional advice</H>
        <P>Analyses, scores, reports, and recommendations produced by DecisionLab are informational guidance only — not financial, legal, tax, or investment advice. Investment and hiring decisions are entirely between the parties involved. DecisionLab is not a broker, agent, employer, or party to any deal, investment, or employment relationship formed through the platform, and does not guarantee funding, matches, or business outcomes.</P></div>

      <div><H>Acceptable use</H>
        <P>Do not misuse the service: no attempts to breach security or access other users' data, no false or misleading startup or investor information, no harvesting of contact details, and no use of the platform for anything unlawful. We may suspend accounts that put other users at risk.</P></div>

      <div><H>Termination</H>
        <P>You can delete your account at any time from Account Settings. We may suspend or terminate accounts that violate these terms. Sections that by their nature should survive (your ownership of your content, liability limits, governing law) survive termination.</P></div>

      <div><H>Liability</H>
        <P>The service is provided "as is" and "as available", without warranties of any kind. To the maximum extent permitted by law, DecisionLab is not liable for indirect, incidental, or consequential damages, or for the outcomes of decisions made using the platform. Our total liability for any claim is limited to the amount you paid us in the three months before the claim.</P></div>

      <div><H>Governing law</H>
        <P>These terms are governed by the laws of the Kingdom of Bahrain. If any part of these terms is found unenforceable, the rest remains in effect.</P></div>

      <div><H>Changes to these terms</H>
        <P>If we make material changes, we will update the date above and announce the change in the product. Continued use after a change means you accept the updated terms.</P></div>
    </LegalShell>
  );
}

export function RefundPolicyPage() {
  return (
    <LegalShell icon={FileText} title="Refund Policy">
      <div><H>Subscriptions & billing</H>
        <P>DecisionLab plans are monthly software subscriptions billed through Paddle.com, our merchant of record. Your plan renews automatically each billing period until cancelled.</P></div>

      <div><H>Cancelling</H>
        <P>You can cancel anytime from your Billing page. Cancellation takes effect at the end of the billing period you have already paid for — you keep your plan's features until that date, and no further charges are made afterwards. Cancelling does not delete your account or content; you simply move to the free plan.</P></div>

      <div><H>When we refund</H>
        <P>If something went wrong with a charge, we will make it right. Contact <a href={`mailto:${SUPPORT}`} className="text-brand-accent font-bold hover:underline">{SUPPORT}</a> within 14 days of the charge for: billing errors, duplicate payments, being charged after a confirmed cancellation, or a technical problem on our side that prevented you from using the plan you paid for.</P></div>

      <div><H>How refunds are processed</H>
        <P>Approved refunds are issued through Paddle to the original payment method, usually within 5–10 business days depending on your bank. We review every request fairly and reply by email.</P></div>

      <div><H>What isn't refundable</H>
        <P>Partial billing periods after a normal cancellation (your plan simply stays active until the period ends), and charges older than 14 days except where the law of your country provides otherwise. Nothing in this policy limits any rights you have under applicable consumer law.</P></div>

      <div><H>Questions</H>
        <P>Unsure whether your situation qualifies? Just ask — email <a href={`mailto:${SUPPORT}`} className="text-brand-accent font-bold hover:underline">{SUPPORT}</a> and we will help.</P></div>
    </LegalShell>
  );
}

export default PrivacyPolicyPage;