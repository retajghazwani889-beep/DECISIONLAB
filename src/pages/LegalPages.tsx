import React from 'react';
import { Shield, FileText, Mail } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// LegalPages — honest beta-stage Privacy Policy and Terms of Service.
// Plain-language placeholders that state the essentials truthfully; replace
// with counsel-reviewed versions before public launch.
// ─────────────────────────────────────────────────────────────────────────────

const CONTACT = 'hello@decisionlabco.com';
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
          <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Last updated: {UPDATED} · Beta version</p>
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
      <div><H>What we collect</H>
        <P>Your account details (name, email, country), the information you add to your profile and startups, files you upload (such as CVs and pitch decks), and the messages you send through our contact form and applications.</P></div>
      <div><H>How we use it</H>
        <P>To run DecisionLab: creating your account, generating startup analyses, matching founders with investors and team members, and responding when you contact us.</P></div>
      <div><H>Who can see your information</H>
        <P>You control your profile's visibility with the privacy setting (Public, Investors Only, Connections Only, Private). Startups you share or submit to the investor network become visible to investor accounts. Your CV and profile are shared with a founder only when you apply to their position.</P></div>
      <div><H>What we don't do</H>
        <P>We don't sell your personal information. We don't show ads.</P></div>
      <div><H>Storage & deletion</H>
        <P>Your data is stored with Google Firebase. You can delete your account anytime from Account Settings, which removes your login, profile, startups, analyses, and applications.</P></div>
      <div><H>Beta notice</H>
        <P>DecisionLab is in beta. This policy is a plain-language summary and will be replaced with a full, reviewed policy before public launch. Material changes will be announced.</P></div>
    </LegalShell>
  );
}

export function TermsOfServicePage() {
  return (
    <LegalShell icon={FileText} title="Terms of Service">
      <div><H>The service</H>
        <P>DecisionLab provides startup validation, AI-generated analysis, pitch tools, and matching between founders, investors, and team members. It is currently offered as a beta: features may change, break, or be removed.</P></div>
      <div><H>Your account</H>
        <P>You're responsible for your account and for the accuracy of what you post. One person per account; keep your password safe. Accounts used for spam, impersonation, or abuse may be removed.</P></div>
      <div><H>Your content</H>
        <P>You own what you upload — your startup information, documents, and profile. By sharing a startup with the investor network you allow investor accounts to view it as designed by the product's sharing controls.</P></div>
      <div><H>Not professional advice</H>
        <P>Analyses, scores, and recommendations are AI-generated guidance, not financial, legal, or investment advice. Investment decisions and hiring decisions are entirely between the parties involved; DecisionLab is not a broker, agent, or party to any deal or employment.</P></div>
      <div><H>Payments</H>
        <P>Paid plans, prices, and features are shown on the pricing page and may change during beta. During the beta period, plan activation may be provided without charge for testing.</P></div>
      <div><H>Liability</H>
        <P>The service is provided "as is" during beta, without warranties. To the maximum extent permitted by law, DecisionLab is not liable for indirect damages or for outcomes of decisions made using the platform.</P></div>
      <div><H>Beta notice</H>
        <P>These terms are a plain-language summary for the beta period and will be replaced with full, reviewed terms before public launch.</P></div>
    </LegalShell>
  );
}

export default PrivacyPolicyPage;