// Lightweight assertion-based test for the signup nurture sequence.
// Run with: npx tsx server/nurture.test.ts
import { runNurtureCycle, decideNurtureAction, NURTURE_EMAILS, type NurtureProfile } from "./nurture";

function assert(cond: any, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`PASS: ${msg}`);
}

async function testEmail1SendsOnNewSignup() {
  const now = new Date("2026-09-16T12:00:00Z");
  const newSignup: NurtureProfile = {
    id: "uid_new_1",
    email: "new.founder@example.com",
    fullName: "Jamie Rivera",
    signupAt: now, // just signed up
    emailStage: 0,
    subscriptionStatus: "free",
  };

  const sentMails: Array<{ to: string; subject: string; text: string }> = [];
  const stageUpdates: Array<{ id: string; stage: number }> = [];

  const result = await runNurtureCycle({
    now: () => now,
    fetchEligibleProfiles: async () => [newSignup],
    updateStage: async (id, nextStage) => { stageUpdates.push({ id, stage: nextStage }); },
    sendMail: async (profile, email) => {
      sentMails.push({ to: profile.email, subject: email.subject, text: email.text("Jamie") });
    },
    log: () => {},
  });

  assert(result.sent === 1, "cycle reports exactly 1 email sent");
  assert(sentMails.length === 1, "sendMail called exactly once");
  assert(sentMails[0].to === "new.founder@example.com", "email sent to the new signup's address");
  assert(
    sentMails[0].subject === "Your DecisionLab account is ready — first move inside",
    "Email 1 subject line matches spec"
  );
  assert(sentMails[0].text.includes("https://decisionlabhub.com"), "Email 1 links to decisionlabhub.com");
  assert(stageUpdates.length === 1 && stageUpdates[0].id === "uid_new_1" && stageUpdates[0].stage === 1,
    "emailStage advances 0 → 1 after Email 1 sends");
}

async function testEmail2WaitsUntilTwoDays() {
  const signupAt = new Date("2026-09-16T00:00:00Z");
  const oneDayLater = new Date("2026-09-17T00:00:00Z"); // only 1 day in
  const profile: NurtureProfile = {
    id: "uid_2",
    email: "waiting@example.com",
    signupAt,
    emailStage: 1,
    subscriptionStatus: "free",
  };
  const action = decideNurtureAction(profile, oneDayLater);
  assert(action.type === "wait", "Email 2 does not send before 2 days have passed");

  const twoDaysLater = new Date("2026-09-18T00:00:01Z");
  const action2 = decideNurtureAction(profile, twoDaysLater);
  assert(action2.type === "send" && action2.email.subject === NURTURE_EMAILS[1].subject,
    "Email 2 sends once >= 2 days have passed");
}

async function testUpgradedUsersSkipEmails2And3() {
  const signupAt = new Date("2026-09-01T00:00:00Z");
  const now = new Date("2026-09-16T00:00:00Z"); // plenty of time elapsed
  const upgraded: NurtureProfile = {
    id: "uid_paid",
    email: "paid@example.com",
    signupAt,
    emailStage: 1,
    subscriptionStatus: "founder", // upgraded off the free tier
  };
  const action = decideNurtureAction(upgraded, now);
  assert(action.type === "skip-advance" && action.nextStage === 2,
    "Upgraded user skips Email 2 and advances stage without sending");

  const upgradedStage2: NurtureProfile = { ...upgraded, emailStage: 2 };
  const action2 = decideNurtureAction(upgradedStage2, now);
  assert(action2.type === "skip-advance" && action2.nextStage === 3,
    "Upgraded user skips Email 3 and advances stage without sending");

  // But Email 1 (requiresFree: false) still applies regardless of tier.
  const upgradedStage0: NurtureProfile = { ...upgraded, emailStage: 0 };
  const action0 = decideNurtureAction(upgradedStage0, now);
  assert(action0.type === "send", "Email 1 still sends even for an already-upgraded profile");
}

async function main() {
  await testEmail1SendsOnNewSignup();
  await testEmail2WaitsUntilTwoDays();
  await testUpgradedUsersSkipEmails2And3();
  console.log("\nAll nurture sequence tests passed.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
