// Signup nurture email sequence: pure decision logic + a runner, decoupled
// from Firestore/nodemailer so it can be unit tested without live credentials.
// server.ts wires the real Firestore Admin SDK + nodemailer transport into
// the `NurtureDeps` interface below and drives it from an hourly interval.

export const DAY_MS = 24 * 60 * 60 * 1000;

const SITE_URL = "https://decisionlabhub.com";

export interface NurtureProfile {
  id: string;
  email: string;
  fullName?: string | null;
  signupAt: Date | null;
  emailStage: number;
  subscriptionStatus?: string | null;
}

export interface NurtureEmail {
  subject: string;
  // Emails 2 and 3 are skipped for users who already upgraded.
  requiresFree: boolean;
  text: (firstName: string) => string;
  html: (firstName: string) => string;
}

function wrapHtml(bodyHtml: string): string {
  return `
<div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#08131D;color:#ffffff;padding:40px;border-radius:24px;line-height:1.6;">
  ${bodyHtml}
  <p style="margin-top:32px;font-size:12px;color:rgba(255,255,255,0.4);">DecisionLab · <a href="${SITE_URL}" style="color:#5DA9FF;text-decoration:none;">decisionlabhub.com</a></p>
</div>`.trim();
}

function ctaButton(label: string, href: string): string {
  return `<div style="text-align:center;margin:28px 0;"><a href="${href}" style="display:inline-block;padding:14px 32px;background:#5DA9FF;color:#04090E;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;border-radius:12px;text-decoration:none;">${label}</a></div>`;
}

export const NURTURE_EMAILS: NurtureEmail[] = [
  // Sent immediately on signup (emailStage 0 → 1).
  {
    subject: "Your DecisionLab account is ready — first move inside",
    requiresFree: false,
    text: (name) =>
      `Hi ${name},\n\n` +
      `Welcome to DecisionLab. The fastest way to get value: type your startup idea and get your free readiness score across market fit, execution, and investor appeal. It takes about a minute.\n\n` +
      `Score my idea: ${SITE_URL}\n\n` +
      `Reply to this email if you get stuck — a real person reads it.\n\n` +
      `— DecisionLab`,
    html: (name) =>
      wrapHtml(`
        <p>Hi ${name},</p>
        <p>Welcome to DecisionLab. The fastest way to get value: type your startup idea and get your free readiness score across market fit, execution, and investor appeal. It takes about a minute.</p>
        ${ctaButton("Score my idea", SITE_URL)}
        <p>Reply to this email if you get stuck — a real person reads it.</p>
      `),
  },
  // ~2 days after signup (emailStage 1 → 2). Skipped for upgraded users.
  {
    subject: "The 3 things investors check before anything else",
    requiresFree: true,
    text: (name) =>
      `Hi ${name},\n\n` +
      `Before investors care about your product, they check: is the problem real and painful, is the market big enough, and can this team win. Most ideas are weakest on one of these — and not knowing which is what kills momentum.\n\n` +
      `DecisionLab's full validation shows you exactly where you stand on all three, with competitor and risk analysis.\n\n` +
      `See your full validation: ${SITE_URL}/pricing\n\n` +
      `— DecisionLab`,
    html: (name) =>
      wrapHtml(`
        <p>Hi ${name},</p>
        <p>Before investors care about your product, they check: is the problem real and painful, is the market big enough, and can this team win. Most ideas are weakest on one of these — and not knowing which is what kills momentum.</p>
        <p>DecisionLab's full validation shows you exactly where you stand on all three, with competitor and risk analysis.</p>
        ${ctaButton("See your full validation", `${SITE_URL}/pricing`)}
      `),
  },
  // ~4 days after signup (emailStage 2 → 3). Skipped for upgraded users.
  {
    subject: "Validate before you build (launch offer inside)",
    requiresFree: true,
    text: (name) =>
      `Hi ${name},\n\n` +
      `Building the wrong thing costs months. Validating costs minutes. The Startup Validation plan gives you market analysis, competitor analysis, risk analysis, SWOT, and a growth roadmap for $39/mo — and this week you can get 40% off with code EARLY40.\n\n` +
      `Validate my idea: ${SITE_URL}/pricing\n\n` +
      `— DecisionLab`,
    html: (name) =>
      wrapHtml(`
        <p>Hi ${name},</p>
        <p>Building the wrong thing costs months. Validating costs minutes. The Startup Validation plan gives you market analysis, competitor analysis, risk analysis, SWOT, and a growth roadmap for $39/mo — and this week you can get 40% off with code <strong>EARLY40</strong>.</p>
        ${ctaButton("Validate my idea", `${SITE_URL}/pricing`)}
      `),
  },
];

// Days since signup required before the email at that stage index may send.
const STAGE_THRESHOLD_DAYS = [0, 2, 4];

export type NurtureAction =
  | { type: "send"; email: NurtureEmail; nextStage: number }
  | { type: "skip-advance"; nextStage: number }
  | { type: "wait" };

/** Pure decision: what (if anything) should happen for this profile right now. */
export function decideNurtureAction(profile: NurtureProfile, now: Date): NurtureAction {
  const stage = profile.emailStage;
  if (!Number.isFinite(stage) || stage < 0 || stage >= NURTURE_EMAILS.length) {
    return { type: "wait" };
  }
  const email = NURTURE_EMAILS[stage];

  // Skip (and advance past) emails 2/3 for anyone who already upgraded.
  if (email.requiresFree && profile.subscriptionStatus && profile.subscriptionStatus !== "free") {
    return { type: "skip-advance", nextStage: stage + 1 };
  }

  if (!profile.signupAt) return { type: "wait" };

  const daysSinceSignup = (now.getTime() - profile.signupAt.getTime()) / DAY_MS;
  const thresholdDays = STAGE_THRESHOLD_DAYS[stage] ?? 0;
  if (daysSinceSignup < thresholdDays) return { type: "wait" };

  return { type: "send", email, nextStage: stage + 1 };
}

export interface NurtureDeps {
  fetchEligibleProfiles: () => Promise<NurtureProfile[]>;
  updateStage: (id: string, nextStage: number) => Promise<void>;
  sendMail: (profile: NurtureProfile, email: NurtureEmail) => Promise<void>;
  now?: () => Date;
  log?: (msg: string) => void;
}

export interface NurtureCycleResult {
  sent: number;
  skipped: number;
  waited: number;
}

/** Runs one pass of the nurture sequence over all eligible profiles. */
export async function runNurtureCycle(deps: NurtureDeps): Promise<NurtureCycleResult> {
  const now = (deps.now || (() => new Date()))();
  const log = deps.log || (() => {});
  let sent = 0, skipped = 0, waited = 0;

  const profiles = await deps.fetchEligibleProfiles();
  for (const profile of profiles) {
    const action = decideNurtureAction(profile, now);

    if (action.type === "wait") {
      waited++;
      continue;
    }

    if (action.type === "skip-advance") {
      await deps.updateStage(profile.id, action.nextStage);
      skipped++;
      log(`Nurture: skipped stage ${action.nextStage - 1}→${action.nextStage} for ${profile.email} (already upgraded).`);
      continue;
    }

    try {
      await deps.sendMail(profile, action.email);
      await deps.updateStage(profile.id, action.nextStage);
      sent++;
      log(`Nurture: sent "${action.email.subject}" to ${profile.email}, stage ${profile.emailStage}→${action.nextStage}.`);
    } catch (err: any) {
      // Leave emailStage untouched so this profile is retried next cycle.
      log(`Nurture: send failed for ${profile.email}: ${err?.message || err}`);
    }
  }

  return { sent, skipped, waited };
}
