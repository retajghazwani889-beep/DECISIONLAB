import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, doc as clientDoc, getDoc as clientGetDoc, setDoc as clientSetDoc } from "firebase/firestore";
import { initializeApp as initializeAdminApp, cert as adminCert } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import crypto from "crypto";
import fs from "fs";
import rateLimit from "express-rate-limit";

dotenv.config();

// Load Firebase configuration synchronously for ultimate compatibility
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig: any = {};
try {
  firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
} catch (err) {
  console.error("Failed to read firebase config in server.ts:", err);
}

// ── Crash guards ─────────────────────────────────────────────────────────────
// A background promise rejection from the Firestore/gRPC layer was killing the
// entire server (Render "instance unavailable" alerts on every tester save).
// Nothing running in this process is allowed to take the whole site down.
process.on('unhandledRejection', (reason: any) => {
  console.warn('Guarded unhandled rejection (server stays up):', reason?.message || reason);
});
process.on('uncaughtException', (err: any) => {
  console.warn('Guarded uncaught exception (server stays up):', err?.message || err);
});

let useAdminSdk = false;
let adminDb: any = null;
let clientDb: any = null;

try {
  // The Admin SDK initializes happily with just a project ID but then CRASHES
  // at write time when no server credentials exist (the exact failure seen on
  // Render). Only enable it when credentials are actually configured:
  //  · FIREBASE_SERVICE_ACCOUNT — paste the service-account JSON into a Render
  //    environment variable of that name, or
  //  · GOOGLE_APPLICATION_CREDENTIALS — standard Google credentials file path.
  const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (svcJson) {
    const adminApp = initializeAdminApp({
      credential: adminCert(JSON.parse(svcJson)),
      projectId: firebaseConfig.projectId,
    });
    adminDb = getAdminFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
    useAdminSdk = true;
    console.log("Firestore Admin SDK initialized with service-account credentials.");
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const adminApp = initializeAdminApp({
      projectId: firebaseConfig.projectId,
    });
    adminDb = getAdminFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
    useAdminSdk = true;
    console.log("Firestore Admin SDK initialized with application default credentials.");
  } else {
    console.log("No server Firebase credentials configured — skipping Admin SDK (client-side saves + local backup handle persistence).");
    throw new Error('no-server-credentials');
  }
} catch (adminErr) {
  console.warn("Could not initialize Firestore Admin SDK (falling back to Client SDK):", adminErr);
  try {
    const firebaseApp = initializeApp(firebaseConfig);
    clientDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
  } catch (clientErr) {
    console.error("Failed to initialize Firestore Client SDK on server:", clientErr);
  }
}

// Resolved at first call by querying the API key's available models
let GEMINI_MODELS: string[] = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
];
let modelsResolved = false;

async function resolveGeminiModels(apiKey: string) {
  if (modelsResolved) return;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await r.json() as any;
    const EXCLUDED_KEYWORDS = ['tts', 'image', 'robotics', 'computer-use', 'research', 'antigravity', 'lyria', 'nano', 'omni', 'gemma', 'preview'];
    const available = (data.models || [])
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => (m.name as string).replace('models/', ''))
      .filter((n: string) => n.startsWith('gemini') && !EXCLUDED_KEYWORDS.some(ex => n.includes(ex)));
    // Always keep gemini-2.0-flash first (confirmed stable), then append others
    const preferred = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];
    const rest = available.filter((n: string) => !preferred.includes(n));
    if (available.length > 0) {
      GEMINI_MODELS = [...preferred.filter((p: string) => available.includes(p)), ...rest];
      modelsResolved = true;
      console.log('Gemini models resolved:', GEMINI_MODELS.slice(0, 5));
    }
  } catch {
    // keep defaults
  }
}

async function geminiGenerateContent(client: any, params: { contents: any; config?: any }, apiKey?: string): Promise<any> {
  if (apiKey) await resolveGeminiModels(apiKey);
  let lastErr: any;
  for (const model of GEMINI_MODELS) {
    try {
      const result = await client.models.generateContent({ model, ...params });
      return result;
    } catch (err: any) {
      const msg = err?.message || JSON.stringify(err);
      if (msg.includes('404') || msg.includes('NOT_FOUND') || msg.includes('no longer available') || msg.includes('deprecated')) {
        lastErr = err;
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Gumroad billing ───────────────────────────────────────────────────────
  const GUMROAD_ACCESS_TOKEN = (process.env.GUMROAD_ACCESS_TOKEN || "").trim();
  const GUMROAD_PERMALINK_TO_TIER: Record<string, string> = {
    "rdnzb":  "founder", // Startup Validation — $39/mo
    "tqownt": "growth",  // Startup Grow — $99/mo
  };

  async function verifyGumroadLicense(permalink: string, licenseKey: string): Promise<any> {
    const params = new URLSearchParams({
      product_permalink: permalink,
      license_key: licenseKey,
      increment_uses_count: "false",
    });
    const r = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GUMROAD_ACCESS_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    return r.json();
  }

  async function findUidByEmail(email: string): Promise<string | null> {
    if (!useAdminSdk || !adminDb) return null;
    // 1. Check Firestore profiles by email field
    try {
      const snap = await adminDb.collection("profiles").where("email", "==", email).limit(1).get();
      if (!snap.empty) return snap.docs[0].id;
    } catch {}
    // 2. Fall back to Firebase Auth user lookup by email
    try {
      const adminAuthInstance = getAdminAuth();
      const userRecord = await adminAuthInstance.getUserByEmail(email);
      if (userRecord?.uid) return userRecord.uid;
    } catch {}
    return null;
  }

  // ── Receipt email ─────────────────────────────────────────────────────────
  const TIER_RECEIPT: Record<string, { name: string; price: string; features: string[] }> = {
    founder: {
      name: 'Startup Validation',
      price: '$39/month',
      features: ['Unlimited Ideas', 'Market & Competitor Analysis', 'Revenue & SWOT', 'Risk Analysis', 'Growth Roadmap'],
    },
    growth: {
      name: 'Startup Grow',
      price: '$99/month',
      features: ['Everything in Validation', 'Team Building', 'Pitch Decks', 'Executive Reports', 'Compare Startups', 'Growth Opportunities', 'Priority Support'],
    },
  };

  async function sendReceiptEmail(opts: { to: string; tier: string; saleId: string; purchasedAt: string }): Promise<void> {
    const host = (process.env.SMTP_HOST || "").trim();
    const user = (process.env.SMTP_USER || "").trim();
    const pass = (process.env.SMTP_PASS || "").trim();
    const from = (process.env.SMTP_FROM || user).trim();
    if (!host || host.includes('@') || !user || !pass) {
      console.warn(`Receipt email skipped (SMTP not configured) for ${opts.to}`);
      return;
    }

    const plan = TIER_RECEIPT[opts.tier];
    if (!plan) { console.warn(`Receipt email: unknown tier '${opts.tier}'`); return; }

    const date = new Date(opts.purchasedAt).toLocaleDateString('en-US', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    const featureRows = plan.features
      .map(f => `<tr><td style="padding:6px 0;color:rgba(255,255,255,0.75);font-size:14px;">✓ &nbsp;${f}</td></tr>`)
      .join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#04090E;font-family:sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#08131D;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0d2035 0%,#08131D 100%);padding:40px 40px 32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
      <p style="margin:0 0 16px;font-size:11px;font-weight:800;letter-spacing:0.25em;text-transform:uppercase;color:#5DA9FF;">DecisionLab</p>
      <div style="width:56px;height:56px;background:#22c55e;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
        <span style="font-size:28px;line-height:1;">✓</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.03em;">Payment Confirmed</h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.5);">Your subscription is now active</p>
    </div>

    <!-- Receipt body -->
    <div style="padding:36px 40px;">

      <!-- Plan summary -->
      <div style="background:rgba(93,169,255,0.07);border:1px solid rgba(93,169,255,0.2);border-radius:16px;padding:24px;margin-bottom:28px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#5DA9FF;">Plan</td>
            <td style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#5DA9FF;" align="right">Amount</td>
          </tr>
          <tr>
            <td style="padding-top:10px;font-size:18px;font-weight:900;color:#ffffff;">${plan.name}</td>
            <td style="padding-top:10px;font-size:18px;font-weight:900;color:#ffffff;" align="right">${plan.price}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:rgba(255,255,255,0.4);">
              Date: ${date} &nbsp;·&nbsp; Order: ${opts.saleId || 'N/A'}
            </td>
          </tr>
        </table>
      </div>

      <!-- Features unlocked -->
      <p style="margin:0 0 12px;font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.4);">What's included</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        ${featureRows}
      </table>

      <!-- CTA -->
      <div style="text-align:center;">
        <a href="https://decisionlabhub.com/dashboard"
           style="display:inline-block;padding:16px 40px;background:#5DA9FF;color:#04090E;font-size:11px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;border-radius:14px;text-decoration:none;">
          Go to Dashboard →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);line-height:1.6;">
        Questions? Reply to this email or visit <a href="https://decisionlabhub.com/contact" style="color:#5DA9FF;text-decoration:none;">decisionlabhub.com/contact</a><br>
        DecisionLab · Subscription billed monthly via Gumroad
      </p>
    </div>

  </div>
</body>
</html>`;

    const transporter = nodemailer.createTransport({
      host, port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });

    try {
      await transporter.sendMail({
        from,
        to: opts.to,
        subject: `Your DecisionLab receipt — ${plan.name}`,
        html,
      });
      console.log(`Receipt sent to ${opts.to} (tier=${opts.tier}, sale=${opts.saleId})`);
    } catch (err: any) {
      console.error(`Receipt email failed for ${opts.to}:`, err?.message || err);
    }
  }

  // ── Rate limiters ─────────────────────────────────────────────────────────
  const webhookLimiter = rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false });
  const syncLimiter    = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false });
  const pollLimiter    = rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false });
  const adminLimiter   = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });

  // ── Audit logger ──────────────────────────────────────────────────────────
  async function auditLog(event: {
    type: string; uid: string; saleId?: string;
    oldTier?: string; newTier?: string; note?: string;
  }) {
    const entry = { ...event, timestamp: new Date().toISOString() };
    console.log("AUDIT:", JSON.stringify(entry));
    if (!useAdminSdk || !adminDb) return;
    try {
      await adminDb.collection("auditLogs").add(entry);
    } catch (err) {
      console.error("Audit log write failed:", err);
    }
  }

  // ── Atomic tier update with retry ─────────────────────────────────────────
  async function setTierAtomic(uid: string, fields: Record<string, any>, retries = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await adminDb.collection("profiles").doc(uid).set(fields, { merge: true });
        return;
      } catch (err: any) {
        console.error(`Firestore write attempt ${i + 1} failed for ${uid}:`, err?.message);
        if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
    console.error(`CRITICAL: Firestore write failed after ${retries} retries for uid=${uid}. Data:`, JSON.stringify(fields));
  }

  // Webhook secret token — add ?secret=YOUR_SECRET to the Gumroad Ping URL to reject forgeries.
  const WEBHOOK_SECRET = (process.env.GUMROAD_WEBHOOK_SECRET || "").trim();

  app.post("/api/gumroad/webhook", webhookLimiter, (req: any, res: any) => {
    const body = req.body || {};

    // Scenario 13: Reject requests missing the secret token (if configured).
    if (WEBHOOK_SECRET) {
      const provided = (req.query.secret || "").toString().trim();
      if (provided !== WEBHOOK_SECRET) {
        console.warn("Gumroad webhook: invalid secret — possible forgery attempt.");
        return res.status(200).json({ received: true }); // 200 so attacker learns nothing
      }
    }

    console.log("GUMROAD PING:", JSON.stringify(body));

    // Acknowledge immediately — Gumroad requires a response within 5 seconds.
    res.status(200).json({ received: true });

    // Test pings — acknowledge only, skip processing.
    const isTest = body.test === "true" || body.test === true;
    if (isTest) { console.log("Gumroad: test ping acknowledged."); return; }

    if (!useAdminSdk || !adminDb) { console.error("Gumroad webhook: admin sdk unavailable"); return; }

    (async () => {
      const email: string          = (body.email || "").toLowerCase().trim();
      const shortPermalink: string = body.short_product_id || body.permalink || "";
      const licenseKey: string     = body.license_key || "";
      const saleId: string         = body.sale_id || "";
      const resourceName: string   = body.resource_name || "sale";
      const subscriptionId: string = body.subscription_id || "";
      const now                    = new Date().toISOString();

      const isCancelled = body.cancelled === "true" || body.cancelled === true;
      const isRefunded  = body.refunded  === "true" || body.refunded  === true || resourceName === "refund";
      const subEnded    = !!body.subscription_ended_at || !!body.subscription_failed_at;
      const tier        = GUMROAD_PERMALINK_TO_TIER[shortPermalink];

      // Scenario 11 & 32: Idempotent processing — deduplicate on saleId + resourceName.
      if (saleId) {
        const eventKey = `${saleId}_${resourceName}`;
        try {
          const existing = await adminDb.collection("webhookEvents").doc(eventKey).get();
          if (existing.exists) {
            console.log(`Gumroad: duplicate webhook ${eventKey} — skipping.`);
            return;
          }
          await adminDb.collection("webhookEvents").doc(eventKey).set({ processedAt: now, email, saleId, resourceName });
        } catch (err) {
          console.warn("Gumroad: could not check duplicate, proceeding anyway:", err);
        }
      }

      // Verify license for new purchases.
      if (licenseKey && !isCancelled && !isRefunded && !subEnded) {
        try {
          const verified = await verifyGumroadLicense(shortPermalink, licenseKey);
          if (!verified?.success) {
            console.warn("Gumroad license verification failed:", JSON.stringify(verified).slice(0, 300));
            return;
          }
        } catch (err) {
          console.error("Gumroad license verify request failed:", err);
          return;
        }
      }

      // Resolve uid from url_params, then fall back to email lookup.
      let uid = "";
      try {
        const raw = body.url_params || "";
        const qs = new URLSearchParams(raw);
        uid = (qs.get("uid") || "").trim();
        if (!uid) { const parsed = JSON.parse(raw || "{}"); uid = (parsed.uid || "").toString().trim(); }
      } catch {}
      if (!uid) uid = (await findUidByEmail(email)) || "";
      if (!uid) {
        console.error(`Gumroad Ping: no uid for email=${email}, permalink=${shortPermalink} — manual reconciliation needed`);
        return;
      }

      // Read current profile to get oldTier for audit and out-of-order protection.
      let oldTier = "free";
      let lastUpdated = "";
      try {
        const profSnap = await adminDb.collection("profiles").doc(uid).get();
        if (profSnap.exists) {
          oldTier = profSnap.data()?.subscriptionStatus || "free";
          lastUpdated = profSnap.data()?.subscriptionUpdatedAt || "";
        }
      } catch (err) {
        console.warn("Gumroad webhook: could not read current profile:", err);
      }

      // Scenario 12: Out-of-order protection — skip if this event is older than last update.
      if (lastUpdated && body.sale_timestamp) {
        const eventTs = new Date(body.sale_timestamp).getTime();
        const lastTs  = new Date(lastUpdated).getTime();
        if (eventTs < lastTs && (isCancelled || isRefunded || subEnded)) {
          console.warn(`Gumroad: out-of-order event skipped (event=${body.sale_timestamp} < last=${lastUpdated}).`);
          return;
        }
      }

      if (isCancelled || isRefunded || subEnded) {
        // Scenario 17, 18, 27: Refund/chargeback/cancel → downgrade to free.
        await setTierAtomic(uid, {
          subscriptionStatus: "free",
          subscriptionUpdatedAt: now,
          subscriptionCancelAt: null,
        });
        await auditLog({ type: resourceName === "refund" ? "refund" : "cancellation", uid, saleId, oldTier, newTier: "free" });
        console.log(`Gumroad: profile ${uid} → 'free' (${resourceName}).`);
      } else if (tier) {
        // Scenario 1, 25, 26, 28: New purchase or renewal → grant tier.
        // Calculate expiry: 32 days from now (monthly sub with 2-day grace period).
        const expiry = new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString();
        await setTierAtomic(uid, {
          subscriptionStatus: tier,
          gumroadSubscriptionId: subscriptionId,
          gumroadSaleId: saleId,
          subscriptionUpdatedAt: now,
          subscriptionStartedAt: oldTier === "free" ? now : undefined,
          subscriptionExpiresAt: expiry,
        });
        const eventType = oldTier === "free" ? "purchase" : (tier === oldTier ? "renewal" : "upgrade");
        await auditLog({ type: eventType, uid, saleId, oldTier, newTier: tier });
        console.log(`Gumroad: profile ${uid} → '${tier}' (${eventType}, sale ${saleId}).`);
        // Send receipt email — fire-and-forget, never blocks the webhook response.
        sendReceiptEmail({ to: email, tier, saleId, purchasedAt: now }).catch(() => {});
      } else {
        console.warn(`Gumroad Ping: unknown permalink '${shortPermalink}'.`);
        await auditLog({ type: "webhook_unknown_product", uid, saleId, note: shortPermalink });
      }
    })();
  });

  // Scenario 45: Daily subscription audit — verifies all paid users still have active Gumroad subs.
  app.post("/api/admin/audit-subscriptions", adminLimiter, async (req: any, res: any) => {
    const adminSecret = (process.env.ADMIN_SECRET || "").trim();
    if (!adminSecret || req.headers["x-admin-secret"] !== adminSecret) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!useAdminSdk || !adminDb || !GUMROAD_ACCESS_TOKEN) {
      return res.status(500).json({ error: "admin sdk or gumroad token unavailable" });
    }
    res.json({ started: true });
    (async () => {
      try {
        const snap = await adminDb.collection("profiles")
          .where("subscriptionStatus", "in", ["founder", "growth"]).get();
        let fixed = 0;
        for (const docSnap of snap.docs) {
          const uid = docSnap.id;
          const prof: any = docSnap.data();
          const email: string = (prof.email || "").toLowerCase();
          if (!email) continue;
          let hasActiveSale = false;
          for (const permalink of ["rdnzb", "tqownt"]) {
            try {
              const r = await fetch(
                `https://api.gumroad.com/v2/sales?product_permalink=${permalink}&email=${encodeURIComponent(email)}`,
                { headers: { Authorization: `Bearer ${GUMROAD_ACCESS_TOKEN}` } }
              );
              const data: any = await r.json();
              const active = (data?.sales || []).find((s: any) => !s.refunded && !s.chargebacked);
              if (active) { hasActiveSale = true; break; }
            } catch {}
          }
          if (!hasActiveSale) {
            await adminDb.collection("profiles").doc(uid).set({
              subscriptionStatus: "free",
              subscriptionUpdatedAt: new Date().toISOString(),
            }, { merge: true });
            console.log(`Audit: downgraded ${uid} (${email}) — no active Gumroad sale.`);
            fixed++;
          }
        }
        console.log(`Audit complete: checked ${snap.docs.length} paid users, fixed ${fixed}.`);
      } catch (err) {
        console.error("Audit error:", err);
      }
    })();
  });

  // Scenario 42 & 43: Admin manual grant/revoke tier.
  app.post("/api/admin/set-tier", adminLimiter, async (req: any, res: any) => {
    const adminSecret = (process.env.ADMIN_SECRET || "").trim();
    if (!adminSecret || req.headers["x-admin-secret"] !== adminSecret) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!useAdminSdk || !adminDb) return res.status(500).json({ error: "admin sdk unavailable" });
    const { uid, tier } = req.body || {};
    const validTiers = ["free", "founder", "growth", "investor_pro"];
    if (!uid || !validTiers.includes(tier)) return res.status(400).json({ error: "uid and valid tier required" });
    const profSnap = await adminDb.collection("profiles").doc(uid).get();
    const oldTier = profSnap.exists ? (profSnap.data()?.subscriptionStatus || "free") : "free";
    await setTierAtomic(uid, {
      subscriptionStatus: tier,
      subscriptionUpdatedAt: new Date().toISOString(),
      manualOverride: true,
    });
    await auditLog({ type: "admin_override", uid, oldTier, newTier: tier, note: "manual admin set-tier" });
    console.log(`Admin: manually set ${uid} → '${tier}'.`);
    return res.json({ ok: true, uid, tier });
  });

  // ── Fresh tier check (used by frontend polling) ───────────────────────────
  // Reads straight from Firestore so there's no React state caching issue.
  app.get("/api/profile/tier", pollLimiter, async (req: any, res: any) => {
    try {
      const token = (req.headers.authorization || "").replace("Bearer ", "").trim();
      if (!token || !useAdminSdk) return res.status(401).json({ error: "unauthorized" });
      const adminAuthInstance = getAdminAuth();
      const decoded = await adminAuthInstance.verifyIdToken(token);
      const uid = decoded.uid;
      const snap = await adminDb!.collection("profiles").doc(uid).get();
      const data = snap.exists ? snap.data() : {};
      let tier: string = data?.subscriptionStatus || "free";

      // Scenario 29: Auto-downgrade expired subscriptions.
      // Lifetime purchases (no expiry set) are never downgraded.
      const paidTiers = ["founder", "growth", "investor_pro"];
      if (paidTiers.includes(tier) && data?.subscriptionExpiresAt) {
        const expired = new Date(data.subscriptionExpiresAt).getTime() < Date.now();
        if (expired) {
          tier = "free";
          await setTierAtomic(uid, { subscriptionStatus: "free", subscriptionUpdatedAt: new Date().toISOString() });
          await auditLog({ type: "expiry", uid, oldTier: data?.subscriptionStatus, newTier: "free", note: `expired at ${data.subscriptionExpiresAt}` });
          console.log(`Expiry: profile ${uid} downgraded to free (expired ${data.subscriptionExpiresAt}).`);
        }
      }

      return res.json({ tier });
    } catch {
      return res.status(401).json({ error: "unauthorized" });
    }
  });

  // ── Fallback sync: query Gumroad sales API to find a recent purchase ─────
  // Called by the frontend after polling times out with no tier change.
  // Looks up the most recent sale for this uid/email and applies the tier.
  app.post("/api/gumroad/sync", syncLimiter, async (req: any, res: any) => {
    try {
      const token = (req.headers.authorization || "").replace("Bearer ", "").trim();
      if (!token || !useAdminSdk || !adminDb) return res.status(401).json({ error: "unauthorized" });
      const adminAuthInstance = getAdminAuth();
      const decoded = await adminAuthInstance.verifyIdToken(token);
      const uid = decoded.uid;

      // Get the user's email from their profile.
      const profileSnap = await adminDb.collection("profiles").doc(uid).get();
      const email = profileSnap.exists ? profileSnap.data()?.email : null;
      if (!email) return res.status(400).json({ error: "no email on profile" });

      // Check each product for a valid sale for this email.
      let appliedTier: string | null = null;
      for (const [tier, permalink] of Object.entries({ founder: "rdnzb", growth: "tqownt" })) {
        try {
          const r = await fetch(
            `https://api.gumroad.com/v2/sales?product_permalink=${permalink}&email=${encodeURIComponent(email)}&page_key=&before=&after=`,
            { headers: { Authorization: `Bearer ${GUMROAD_ACCESS_TOKEN}` } }
          );
          const data: any = await r.json();
          const sales = data?.sales || [];
          const cutoff = Date.now() - 24 * 60 * 60 * 1000; // only purchases in the last 24h
          const active = sales.find((s: any) =>
            !s.refunded && !s.chargebacked &&
            s.email?.toLowerCase() === email.toLowerCase() &&
            new Date(s.created_at).getTime() > cutoff
          );
          if (active) {
            appliedTier = tier;
            break;
          }
        } catch {}
      }

      if (appliedTier) {
        const currentTierSnap = await adminDb.collection("profiles").doc(uid).get();
        const oldTier = currentTierSnap.exists ? (currentTierSnap.data()?.subscriptionStatus || "free") : "free";
        await setTierAtomic(uid, {
          subscriptionStatus: appliedTier,
          subscriptionUpdatedAt: new Date().toISOString(),
        });
        await auditLog({ type: "sync_recovery", uid, oldTier, newTier: appliedTier, note: "recovered via Gumroad sales API" });
        console.log(`Gumroad sync: profile ${uid} → '${appliedTier}' via sales API.`);
        return res.json({ tier: appliedTier });
      }

      // No active sale found — return current tier.
      const currentTier = profileSnap.exists ? (profileSnap.data()?.subscriptionStatus || "free") : "free";
      return res.json({ tier: currentTier });
    } catch (err) {
      console.error("Gumroad sync error:", err);
      return res.status(500).json({ error: "sync failed" });
    }
  });

  app.post("/api/billing/cancel", async (req: any, res: any) => {
    try {
      if (!useAdminSdk || !adminDb) {
        return res.status(500).json({ error: "Server is not configured for billing (admin SDK unavailable)." });
      }
      if (!GUMROAD_ACCESS_TOKEN) {
        return res.status(500).json({ error: "Billing is not fully configured. Please contact support." });
      }

      const authHeader = String(req.headers["authorization"] || "");
      const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
      if (!idToken) return res.status(401).json({ error: "Not signed in." });
      let uid = "";
      try {
        const decoded = await getAdminAuth().verifyIdToken(idToken);
        uid = decoded.uid;
      } catch {
        return res.status(401).json({ error: "Invalid or expired session. Please sign in again." });
      }

      const profSnap = await adminDb.collection("profiles").doc(uid).get();
      const prof: any = profSnap.exists ? profSnap.data() : null;
      const subId: string = prof?.gumroadSubscriptionId || "";
      if (!subId) {
        return res.status(400).json({ error: "No active subscription found on this account." });
      }

      const gmRes = await fetch(`https://api.gumroad.com/v2/subscribers/${subId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${GUMROAD_ACCESS_TOKEN}` },
      });
      const gmJson: any = await gmRes.json().catch(() => ({}));

      if (!gmRes.ok) {
        console.error("Gumroad cancel failed:", gmRes.status, JSON.stringify(gmJson).slice(0, 400));
        return res.status(502).json({ error: "Could not cancel with the payment provider. Please try again or contact support." });
      }

      const endDate = gmJson?.subscriber?.ended_at || gmJson?.ended_at || null;
      try {
        await adminDb.collection("profiles").doc(uid).set({
          subscriptionCancelAt: endDate || new Date().toISOString(),
        }, { merge: true });
      } catch (e) { console.warn("Could not store subscriptionCancelAt:", e); }

      console.log(`Billing: Gumroad sub ${subId} for ${uid} cancelled. Ends: ${endDate}`);
      return res.status(200).json({ ok: true, endsAt: endDate });
    } catch (err) {
      console.error("Cancel endpoint error:", err);
      return res.status(500).json({ error: "Something went wrong. Please try again." });
    }
  });


  const LOCAL_BACKUP_DIR = path.join(process.cwd(), "data", "analyses");
  if (!fs.existsSync(LOCAL_BACKUP_DIR)) {
    try {
      fs.mkdirSync(LOCAL_BACKUP_DIR, { recursive: true });
    } catch (mkdirErr) {
      console.warn("Could not create local backup directory:", mkdirErr);
    }
  }

  // API proxy endpoint for fetching a single project from Firestore
  app.get("/api/analyses/:id", async (req, res) => {
    const { id } = req.params;

    // Require a valid Firebase ID token so analyses are owner-only reads.
    if (useAdminSdk) {
      const authHeader = req.headers.authorization || '';
      const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      if (!idToken) return res.status(401).json({ error: 'Unauthorized' });
      try { await getAdminAuth().verifyIdToken(idToken); }
      catch { return res.status(401).json({ error: 'Unauthorized' }); }
    }

    // First, let's see if we have a local filesystem backup to guarantee ultra-fast, permission-error-free loads
    let localData: any = null;
    const localFilePath = path.join(LOCAL_BACKUP_DIR, `${id}.json`);
    try {
      if (fs.existsSync(localFilePath)) {
        localData = JSON.parse(fs.readFileSync(localFilePath, "utf-8"));
      }
    } catch (localErr) {
      console.warn("Could not read local backup file:", localErr);
    }

    try {
      if (useAdminSdk && adminDb) {
        const docRef = adminDb.collection('analyses').doc(id);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          const data = docSnap.data();
          // Keep local sync
          try {
            fs.writeFileSync(localFilePath, JSON.stringify(data, null, 2), "utf-8");
          } catch (_) {}
          return res.json({ found: true, data });
        }
      } else {
        const docRef = clientDoc(clientDb, 'analyses', id);
        const docSnap = await clientGetDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Keep local sync
          try {
            fs.writeFileSync(localFilePath, JSON.stringify(data, null, 2), "utf-8");
          } catch (_) {}
          return res.json({ found: true, data });
        }
      }

      // If Firestore doesn't find it (or is uninitialized), check if we have local backup data
      if (localData) {
        return res.json({ found: true, data: localData });
      }
      res.json({ found: false });
    } catch (error: any) {
      // Gracefully fall back to local data if Firestore fails due to permissions/connection issues
      if (localData) {
        console.warn("Firestore fetch failed, falling back to local storage:", error.message || error);
        return res.json({ found: true, data: localData });
      }
      console.warn("Server API Firestore fetch warning (this is expected if Firestore is still being provisioned):", error.message || error);
      res.json({ found: false, error: error.message });
    }
  });

  // API proxy endpoint for updating or creating a project in Firestore
  app.post("/api/analyses/:id", async (req, res) => {
    const { id } = req.params;
    const body = req.body;
    // Verify caller owns this analysis — require a valid Firebase ID token.
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (idToken && useAdminSdk) {
      try {
        const decoded = await getAdminAuth().verifyIdToken(idToken);
        if (body.userId && body.userId !== decoded.uid) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      } catch { return res.status(401).json({ error: 'Unauthorized' }); }
    }
    const localFilePath = path.join(LOCAL_BACKUP_DIR, `${id}.json`);

    // First, immediately save to local backup file to guarantee data persistence regardless of Firestore permission issues!
    try {
      let mergedBody = { ...body };
      if (fs.existsSync(localFilePath)) {
        try {
          const existingLocal = JSON.parse(fs.readFileSync(localFilePath, "utf-8"));
          mergedBody = { ...existingLocal, ...body };
        } catch (_) {}
      }
      fs.writeFileSync(localFilePath, JSON.stringify(mergedBody, null, 2), "utf-8");
    } catch (localErr) {
      console.warn("Could not write local backup file:", localErr);
    }

    try {
      if (useAdminSdk && adminDb) {
        const docRef = adminDb.collection('analyses').doc(id);
        await docRef.set(body, { merge: true });
        res.json({ success: true });
      } else {
        const docRef = clientDoc(clientDb, 'analyses', id);
        await clientSetDoc(docRef, body, { merge: true });
        res.json({ success: true });
      }
    } catch (error: any) {
      // This is a soft warning now instead of a console.error because we have a guaranteed local backup!
      // This avoids marking the app as failed due to cloud sandbox environment IAM restrictions.
      console.warn("Server API Firestore write warning (using secure local backup fallback):", error.message || error);
      res.json({ success: true, backup: true }); // Return success: true so the client knows the data is safe in local fallback!
    }
  });

  // API Route for testing SMTP
  app.post("/api/test-email", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Target email required' });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: "DecisionLab - SMTP Configuration Test",
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #08131D; color: #ffffff; padding: 40px; border-radius: 24px;">
            <h1 style="color: #5DA9FF; margin-bottom: 20px;">System Test Successful</h1>
            <p style="color: rgba(255,255,255,0.7); line-height: 1.6;">Your SMTP integration for <strong>DecisionLab</strong> is active and functional.</p>
            <div style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;">
              <p style="margin: 0; font-size: 14px; color: #67E8F9;">Verification Code: ${Math.floor(100000 + Math.random() * 900000)}</p>
            </div>
            <p style="margin-top: 30px; font-size: 12px; color: rgba(255,255,255,0.4);">This is an automated system check.</p>
          </div>
        `
      });
      res.json({ success: true, message: 'Test email sent' });
    } catch (error: any) {
      console.error('SMTP Test Failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API Route for notifications
  app.post("/api/notify", async (req, res) => {
    const { type, userData } = req.body;
    
    const host = process.env.SMTP_HOST || "";
    const user = process.env.SMTP_USER || "";
    const pass = process.env.SMTP_PASS || "";
    const from = process.env.SMTP_FROM || "";

    const isHostEmail = host.includes("@");
    const isConfigured = host.trim().length > 0 && !isHostEmail && user.trim().length > 0 && pass.trim().length > 0;

    if (!isConfigured) {
      console.warn('Email system bypass: SMTP host, user, or pass not configured or invalid (e.g. host contains "@" or is empty).');
      return res.json({ success: true, message: 'Notification skipped (not configured)' });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: host,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
        auth: {
          user: user,
          pass: pass,
        },
      });

      if (type === 'welcome') {
        const { email, fullName } = userData;
        const firstName = fullName.split(' ')[0];
        
        await transporter.sendMail({
          from: from || user,
          to: email,
          subject: "Welcome to DecisionLab",
          text: `Hello ${firstName},\n\nWelcome to DecisionLab.\n\nYour workspace has been successfully activated and is ready for venture analysis, strategic review, and execution planning.\n\nYou can now access your dashboard and begin using the platform.\n\n— DecisionLab`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #08131D; line-height: 1.6;">
              <p>Hello ${firstName},</p>
              <p>Welcome to DecisionLab.</p>
              <p>Your workspace has been successfully activated and is ready for venture analysis, strategic review, and execution planning.</p>
              <p>You can now access your dashboard and begin using the platform.</p>
              <p>— DecisionLab</p>
            </div>
          `
        });

        // Send admin notification if ADMIN_EMAIL is configured
        if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.includes('@')) {
          await transporter.sendMail({
            from: from || user,
            to: process.env.ADMIN_EMAIL,
            subject: `[INTERNAL] New Intelligence Activation: ${fullName}`,
            html: `
              <div style="font-family: 'Inter', sans-serif; background: #08131D; color: #ffffff; padding: 40px; border-radius: 20px;">
                <h2 style="color: #5DA9FF; margin-bottom: 20px;">New User Signed Up</h2>
                <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; font-size: 14px;">
                  <p><strong>Name:</strong> ${fullName}</p>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Role:</strong> ${userData.roleType || 'N/A'}</p>
                  <p><strong>Startup:</strong> ${userData.startupName || 'N/A'}</p>
                  <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                </div>
              </div>
            `
          });
        }
        
        res.json({ success: true });
      } else {
        res.status(400).json({ error: 'Invalid notification type' });
      }
    } catch (error: any) {
      console.warn('Email notification failed gracefully:', error.message || error);
      // We don't want to break the signup flow if email fails, but we should log it as a warning
      res.json({ success: true, bypassed: true, error: 'Email service unavailable' });
    }
  });

  // Debug: list available models for this API key
  app.get("/api/gemini/list-models", async (_req, res) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: 'No GEMINI_API_KEY' });
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      const data = await r.json() as any;
      const models = (data.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => m.name);
      res.json({ models });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API proxy endpoint for generating slides via Gemini
  app.post("/api/gemini/generate-slides", async (req, res) => {
    const { profile, template } = req.body;
    if (!profile) return res.status(400).json({ error: 'Profile is required' });

    {
      const authHeader = req.headers.authorization || '';
      const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      if (!idToken) return res.status(401).json({ error: 'Unauthorized' });
      if (!useAdminSdk) return res.status(503).json({ error: 'Auth unavailable' });
      try { await getAdminAuth().verifyIdToken(idToken); }
      catch { return res.status(401).json({ error: 'Unauthorized' }); }
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing on the server' });
    }

    try {
      const { GoogleGenAI, Type } = await import("@google/genai");
      const client = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Simple helpers to clean titles, punctuation, and copy on response to guarantee rule adherence
      const cleanBodyLanguage = (str: string): string => {
        if (!str) return '';
        let result = str;
        const replacements: [RegExp, string][] = [
          [/Revolutionary/gi, 'Innovative'],
          [/Game-changing/gi, 'High-impact'],
          [/Synergistic/gi, 'Cohesive'],
          [/Disruptive/gi, 'Strategic'],
          [/Disrupting/gi, 'Improving'],
          [/Disrupt/gi, 'Modernize'],
          [/Hyper-scale/gi, 'Industry-standard'],
          [/Hyper scale/gi, 'Industry standard'],
          [/hyperscale/gi, 'industry-standard'],
          [/EXCRUCIATING/gi, 'High'],
          [/unbeatable/gi, 'rigorous'],
          [/bold ask/gi, 'investment target'],
          [/Dominating/gi, 'Leading'],
          [/co-dominance/gi, 'leadership'],
          [/soaring/gi, 'consistent'],
          [/Unfair/gi, 'Competitive'],
          [/unfair/gi, 'competitive']
        ];
        for (const [pattern, repl] of replacements) {
          result = result.replace(pattern, repl);
        }
        return result;
      };

      const cleanTitleOrLabel = (str: string): string => {
        if (!str) return '';
        let temp = str.trim();
        // Remove ending trails and internal static full stops (keep digits like 1.5)
        temp = temp.replace(/\.(?!\d)|(?<!\d)\./g, '').trim();
        temp = temp.replace(/[\.!?,;:\s\-\|]+$/, '').trim();

        const upper = temp.toUpperCase();
        if (upper.includes("EXECUTIVE SUMMARY") || upper.includes("SUMMARY") || upper.includes("CONCEPT OVERVIEW")) {
          return "Executive Summary";
        }
        if (upper.includes("DISRUPTIVE HYPER-SCALE DISCOVERY") || upper.includes("DISRUPTIVE HYPER SCALE DISCOVERY") || upper.includes("DISRUPTIVE HYPER-SCALE") || upper.includes("VENTURE ASSESSMENT") || upper.includes("THE PROBLEM") || upper.includes("INDUSTRY PROBLEM") || upper.includes("MARKET PROBLEM") || upper.includes("PROBLEM")) {
          return "The Problem";
        }
        if (upper.includes("MASSIVE TAM SIZE TO EXPLOIT") || upper.includes("TAM SIZE TO EXPLOIT") || upper.includes("VALUATION") || upper.includes("MARKET OPPORTUNITY") || upper.includes("MARKET VALUE") || upper.includes("TAM SAM SOM")) {
          return "Market Opportunity";
        }
        if (upper.includes("CURRENT SOLUTIONS") || upper.includes("EXISTING ALTERNATIVES") || upper.includes("LEGACY WAYS") || upper.includes("LEGACY ALTERNATIVES")) {
          return "Current Solutions";
        }
        if (upper.includes("ECOSYSTEM DISRUPTION SOLUTION") || upper.includes("DISRUPTION SOLUTION") || upper.includes("INTEGRATIVE ARCHITECTURE") || upper.includes("OUR SOLUTION") || upper.includes("THE SOLUTION")) {
          return "Our Solution";
        }
        if (upper.includes("PRODUCT OVERVIEW") || upper.includes("THE BOLD VISION") || upper.includes("STRATEGIC INITIATIVE EXECUTIVE HIGHLIGHTS") || upper.includes("PRODUCT DEVELOPMENT")) {
          return "Product Overview";
        }
        if (upper.includes("POWERFUL DEFENSIVE ARMOR") || upper.includes("DEFENSIVE ARMOR") || upper.includes("CERTIFICATION POSTURE") || upper.includes("COMPETITIVE ADVANTAGE") || upper.includes("UNIQUE MOAT") || upper.includes("MOATS")) {
          return "Competitive Advantage";
        }
        if (upper.includes("REVENUE MODELS TO SCALE") || upper.includes("REVENUE MODEL TO SCALE") || upper.includes("REVENUE MODALITY") || upper.includes("BUSINESS MODEL")) {
          return "Business Model";
        }
        if (upper.includes("MARKET VALIDATION") || upper.includes("PILOT STUDY") || upper.includes("TRACTION")) {
          return "Market Validation";
        }
        if (upper.includes("DOMINATING THE ENTIRE FIELD") || upper.includes("COMPETITIVE MATRIX") || upper.includes("COMPETITIVE ANALYSIS") || upper.includes("COMPOSITE POSTURE")) {
          return "Competitive Analysis";
        }
        if (upper.includes("ROADMAP TO CATEGORY") || upper.includes("ROADMAP") || upper.includes("OPERATIONAL ROADMAP") || upper.includes("GROWTH STRATEGY") || upper.includes("EXPANSION ROADMAP")) {
          return "Growth Strategy";
        }
        if (upper.includes("FINANCIAL FORECAST") || upper.includes("FINANCIAL PROJECTIONS") || upper.includes("FORECAST") || upper.includes("FINANCIALS")) {
          return "Financial Projections";
        }
        if (upper.includes("RISK ASSESSMENT") || upper.includes("RISK MITIGATION") || upper.includes("KEY RISKS") || upper.includes("THREATS")) {
          return "Risk Assessment";
        }
        if (upper.includes("CAPITAL REQUIREMENTS") || upper.includes("THE BOLD ASK FOR DISRUPTORS") || upper.includes("GROWTH CAPITAL ASK") || upper.includes("ALLOCATION SCHEME") || upper.includes("CAPITAL ALLOCATION") || upper.includes("FUNDING ASK") || upper.includes("THE ASK") || upper.includes("INVESTMENT TARGET")) {
          return "Funding Ask";
        }
        if (upper.includes("NEXT STEPS") || upper.includes("IMMEDIATE MILESTONES") || upper.includes("WHAT IS NEXT") || upper.includes("FUTURE MILESTONES") || upper.includes("ROLES AND RECRUITING")) {
          return "Next Steps";
        }
        return temp;
      };

      const cleanPunctuation = (str: string): string => {
        if (!str) return '';
        const lines = str.split('\n').map(line => {
          let temp = line.trim();
          temp = temp.replace(/\.(?!\d)|(?<!\d)\./g, '').trim();
          temp = temp.replace(/[\.!?,;:\s\-\|]+$/, '').trim();
          return cleanBodyLanguage(temp);
        });
        return lines.join('\n');
      };

      const systemInstruction = `
        You are an elite Pitch Deck Strategist and Lead Business Consultant.
        Your goal is to build an executive presentation that translates virtual analysis results directly into a 15-slide narrative.

        Strictly follow these requirements:
        1. Ban all jargon and buzzwords. Write so a first-time entrepreneur with no business degree can understand every word.
        2. Slide titles must be instantly clear — plain English, no acronyms. A 16-year-old should understand the title.
        3. Do not include periods, full stops, or trailing punctuation anywhere.
        4. No "lorem ipsum" or generic filler text. Use only real data from the startup profile.
        5. Replace any technical terms: TAM→"total market size", CAC→"cost to get one customer", LTV→"value per customer", SaaS→"software subscription", B2B→"business customers", MVP→"first version", KPIs→"key goals", ROI→"profit on investment", churn→"customers leaving", runway→"months of money left".
      `;

      const slideSchema = {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          points: { type: Type.ARRAY, items: { type: Type.STRING } },
          metric: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              value: { type: Type.STRING }
            },
            required: ["label", "value"]
          },
          visualSuggestion: { type: Type.STRING },
          imageKeywords: { type: Type.STRING },
          colorAccent: { type: Type.STRING },
          layout: { type: Type.STRING }
        },
        required: ["id", "title", "content", "points", "visualSuggestion", "imageKeywords", "colorAccent"]
      };

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          slides: {
            type: Type.ARRAY,
            items: slideSchema
          }
        },
        required: ["slides"]
      };

      const promptStr = `
        Analyze this startup profile and execute the full DecisionLab suite:
        - Startup Name: ${profile.companyName || "Selected Venture"}
        - Industry Sector: ${profile.industry || "Technology Solutions"}
        - Funding Stage: ${profile.fundingStage || "Seed Stage"}
        - Target Market: ${profile.targetMarket || "Global Enterprises"}
        - Base Description: ${profile.description || ""}
        - Core Problem: ${profile.problem || ""}
        - Core Solution: ${profile.solution || ""}
        - Business/Revenue Model: ${profile.businessModel || ""} - Current Tiers: ${profile.revenueModel || ""}
        - Competitors: ${profile.competitors || ""}

        CRITICAL ASSIGNMENT:
        You must perform 7 analytical reports on this startup profile (virtually):
        1. Market Analysis (TAM/SAM/SOM sizing and CAGRs)
        2. Competitor Analysis (gaps in legacy options, competitor profiling)
        3. SWOT Analysis (precise strengths, risks, threats, opportunities)
        SWOT (CRITICAL — investor-facing): Populate the \`swot\` object with 3-4 items each for strengths, weaknesses, opportunities, threats, ALL specific to THIS venture (never generic). For every item provide:
          - \`point\`: the specific factor in a short phrase, and
          - \`why\`: 1-2 full sentences explaining WHY it matters to an investor — the concrete consequence, risk, or advantage. For weaknesses and threats, explain plainly why it is a problem and what it could cost. Base every item on the actual analysis (scores, market, competitors, stage, risks) — not boilerplate.

        4. Business Model Analysis (pricing, margin structure)
        5. Investor Readiness Analysis (validation metrics, scores)
        6. Growth Analysis (milestones, customer acquisition pathways)
        7. Risk Analysis (mitigations for high impact market & execution risks)

        Using the findings of these analyses, generate exactly 15 pitch deck slides in this specific order:
        1. Executive Summary: High-level visual overview of the entire analytical suite findings.
        2. The Problem: Market friction discovered by report (e.g. lost operational hours, high latencies, empty capacities).
        3. Market Opportunity: Concrete sizing metrics (TAM SAM SOM, CAGR) validated by the Market Analysis.
        4. Current Solutions: Inadequate legacy alternatives or manual workarounds identified by the Competitor Analysis.
        5. Our Solution: Core proposition solving the exact problem.
        6. Product Overview: Modular feature descriptions and system workflow.
        7. Competitive Advantage: IP, patented neural filters, compliance checks, or moats from SWOT.
        8. Business Model: subscription parameters, pricing levels, and monetization streams.
        9. Market Validation: pilot tests, customer validation metrics, early traction numbers.
        10. Competitive Analysis: direct matrix comparisons with named alternatives.
        11. Growth Strategy: Acquisition channels, high-impact marketing, and strategic growth plan.
        12. Financial Projections: Year 1-3 revenue forecasts.
        13. Risk Assessment: Critical execution risk metrics paired with action-oriented mitigation steps.
        14. Funding Ask: Exact round targets and allocation percentages.
        15. Next Steps: Roadmap schedule, upcoming hiring hires, and technical feature milestones.

        Ensure all titles, points, and metrics have no trailing punctuation or full stops. Use simple, direct language.
      `;

      const result = await geminiGenerateContent(client, {
        contents: promptStr,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema as any,
          temperature: 0
        }
      }, key);

      const parsed = JSON.parse(result.text || '{}');
      const rawSlides = parsed.slides || [];

      // Secondary Server-Side Sanitization step to absolutely guarantee perfect Zero-Punctuation / Jargon-free format
      const sanitizedSlides = rawSlides.map((s: any, idx: number) => {
        let cleanedTitle = cleanTitleOrLabel(s.title || '');
        if (!cleanedTitle) {
          const defaultTitles = [
            "Executive Summary", "The Problem", "Market Opportunity", "Current Solutions", "Our Solution",
            "Product Overview", "Competitive Advantage", "Business Model", "Market Validation", "Competitive Analysis",
            "Growth Strategy", "Financial Projections", "Risk Assessment", "Funding Ask", "Next Steps"
          ];
          cleanedTitle = defaultTitles[idx] || "Venture Detail";
        }
        const cleanedContent = cleanPunctuation(s.content || '');
        const cleanedPoints = (s.points || []).map((p: string) => cleanPunctuation(p));
        const cleanedMetricLabel = cleanTitleOrLabel(s.metric?.label || 'KPI Target');
        const cleanedMetricValue = cleanPunctuation(s.metric?.value || 'Scale');

        let slideLayout = s.layout || 'split';
        if (idx === 0) slideLayout = 'hero';
        else if (idx === 9) slideLayout = 'grid';

        return {
          ...s,
          id: `slide_${idx}_${Math.random().toString(36).substr(2, 9)}`,
          title: cleanedTitle,
          content: cleanedContent,
          points: cleanedPoints,
          metric: {
            label: cleanedMetricLabel,
            value: cleanedMetricValue
          },
          layout: slideLayout
        };
      });

      res.json({
        slides: sanitizedSlides
      });
    } catch (error: any) {
      console.error("Express Gemini Slides Generation Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API proxy endpoint for analyzing a startup idea via Gemini
  app.post("/api/gemini/analyze-startup-idea", async (req, res) => {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'Description is required' });

    // Resolve isPremium from the server — never trust the client flag.
    let isPremium = false;
    {
      const authHeader = req.headers.authorization || '';
      const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      if (!idToken) return res.status(401).json({ error: 'Unauthorized' });
      if (!useAdminSdk) return res.status(503).json({ error: 'Auth unavailable' });
      try {
        const decoded = await getAdminAuth().verifyIdToken(idToken);
        const profileSnap = await adminDb.collection('profiles').doc(decoded.uid).get();
        const sub = profileSnap.exists ? (profileSnap.data()?.subscriptionStatus || 'free') : 'free';
        isPremium = ['founder', 'growth', 'investor_pro', 'premium'].includes(sub);
      } catch { return res.status(401).json({ error: 'Unauthorized' }); }
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing on the server' });
    }

    try {
      const { GoogleGenAI, Type } = await import("@google/genai");
      const client = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const getInputHash = (str: string): number => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = (hash << 5) - hash + str.charCodeAt(i);
          hash |= 0; 
        }
        return Math.abs(hash) % 1000;
      };

      const uniqueSeed = getInputHash(description);

      const systemInstruction = `
        You are DecisionLab's Venture Capital Analyst. Your ONLY job is to evaluate what was actually written in the idea submission — nothing more.

        ### THE GOLDEN RULE — EVIDENCE FIRST:
        Every score and every sentence of analysis MUST be traceable to something explicitly stated in the idea text.
        - If it was NOT written by the founder, do NOT assume it, invent it, or give credit for it.
        - Never fill gaps with "typically in this industry…" or generic statements. State what is missing.
        - Do NOT award high scores because the idea sounds promising in theory. Only award high scores when the founder's text provides concrete, specific evidence.

        ### EVIDENCE-BASED SCORING RUBRIC (0–100 integers only):

        ideaStrength (Is the problem real and clearly described in the text?):
        - 80–100: Specific problem described with real examples or data. Clear who suffers and why existing solutions fail.
        - 60–79: Problem mentioned but vague or broad. No supporting data.
        - 40–59: Problem implied but not clearly articulated.
        - 0–39: No clear problem, or just buzzwords.

        marketFit (Is there a clear, sizeable market described in the text?):
        - 80–100: Specific target customers named, market size mentioned, demand signals or early users referenced.
        - 60–79: Market mentioned generally without specifics.
        - 40–59: Market vague or implied.
        - 0–39: No market defined.

        execution (Is there evidence in the text that this can be built and sold?):
        - 80–100: Relevant experience stated. Team skills described. Progress already made.
        - 60–79: Some relevant background mentioned.
        - 40–59: Generic background or solo/unspecified.
        - 0–39: No background or team mentioned.

        scalability (Does the text describe a model that can grow without huge extra cost?):
        - 80–100: Digital or platform model clearly described with network effects or low marginal cost.
        - 60–79: Some scalability potential described.
        - 40–59: Scalability unclear.
        - 0–39: Highly manual or local with no scalable model described.

        competition (Does the text address competition with a real, specific advantage?):
        - 80–100: Competitors named, specific credible advantage explained (technology, pricing, data, distribution).
        - 60–79: Competition acknowledged with general differentiation.
        - 40–59: Competition not addressed.
        - 0–39: Assumes no competition or shows no awareness.

        investorAppeal (Based only on what was written, would an investor find this compelling?):
        - 80–100: Strong problem, clear solution, believable execution, evidence of demand — investor can form a thesis.
        - 60–79: Interesting but missing key evidence investors need.
        - 40–59: Weak pitch with little substance.
        - 0–39: Too thin, generic, or contradictory.

        ### REAL-WORLD BENCHMARKING (CRITICAL FOR FAIR SCORING):
        Use your knowledge of real startups, markets, and industries to calibrate every score against what actually exists in the world.

        For each idea, before scoring ask:
        - Does a company already doing this exact thing exist? (e.g., if someone pitches "Uber for X", Uber already exists — competition score must reflect that)
        - How many funded startups are in this space? A crowded space = lower competition score unless a clear edge is stated.
        - What do successful startups in this category look like at this stage? Compare the founder's idea to real benchmarks.
        - Is the market size they're claiming realistic based on actual industry data you know?

        BENCHMARK CALIBRATION EXAMPLES (use these as reference points):
        - A idea identical or very similar to an already well-funded global company (Airbnb, Uber, Stripe, etc.) with no differentiation stated: competition score 20–35, ideaStrength 30–50.
        - An idea in a genuinely underserved niche with a specific local angle (e.g., same-day pharmacy delivery in a country with no such service): marketFit 70–85 if evidence provided.
        - An idea in an oversaturated space (food delivery, social media, generic e-commerce) with no stated differentiation: competition score 15–40.
        - An idea solving a real, painful, verifiable problem that has no well-known solution: ideaStrength 75–90.
        - A solo founder at idea stage with no background mentioned: execution 25–45 regardless of idea quality.
        - A team with directly relevant domain experience stated: execution 65–85.

        Always mention in the explanation which real companies or market conditions you compared this to.

        ### SCORING RULES:
        1. Each score explanation MUST: (a) quote specific words from the founder's input AND (b) name the real-world comparison or market fact that calibrated the score.
        2. Use exact integers (e.g., 67, 74, 83) — not rounded numbers like 60, 70, 80.
        3. Do NOT give the same score to multiple dimensions unless evidence genuinely supports the same level.
        4. If total input text is under 20 words, cap ALL scores at 45.
        5. A score above 80 requires BOTH strong founder evidence AND a favorable real-world market position.

        ### SWOT: Each item must reference something the founder actually wrote AND a real market fact. No generic items.

        ### LANGUAGE & TONE:
        - Plain English for first-time founders. No jargon or acronyms.
        - Replace: TAM/SAM/SOM→"total market size / reachable slice / first customers", CAGR→"yearly growth rate", CAC→"cost to get one customer", LTV→"value per customer", burn rate→"monthly spending", runway→"months of money left", churn→"customers leaving", pivot→"change direction", go-to-market→"how you reach customers", moat→"what makes you hard to copy", scalable→"can grow without huge extra costs", traction→"early proof customers want this", SaaS→"software subscription", MVP→"first version", KPIs→"key goals", ROI→"profit on investment", B2B→"business customers", B2C→"regular people", SME→"small business".
        - Keep it short and clear. Any first-time founder should understand every word.

        ### FORMATTING RULES (STRICT):
        - Do NOT end any bullet point or list item with a period or full stop.
        - Do NOT use hyphens (-, –, —) at the start of sentences or as bullet markers in text fields.
        - Do NOT use em-dashes or en-dashes inside sentences unless absolutely required for meaning.
        - Write list items as short natural phrases, not punctuated sentences.
        - No trailing punctuation on list items at all.
      `;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          scores: {
            type: Type.OBJECT,
            properties: {
              ideaStrength: {
                type: Type.OBJECT,
                properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
                required: ["score", "explanation"]
              },
              marketFit: {
                type: Type.OBJECT,
                properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
                required: ["score", "explanation"]
              },
              execution: {
                type: Type.OBJECT,
                properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
                required: ["score", "explanation"]
              },
              scalability: { 
                type: Type.OBJECT, 
                properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
                required: ["score", "explanation"]
              },
              competition: { 
                type: Type.OBJECT, 
                properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
                required: ["score", "explanation"]
              },
              investorAppeal: { 
                type: Type.OBJECT, 
                properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
                required: ["score", "explanation"]
              }
            },
            required: ["ideaStrength", "marketFit", "execution", "scalability", "competition", "investorAppeal"]
          },
          startupProfile: {
            type: Type.OBJECT,
            properties: {
              companyName: { type: Type.STRING },
              country: { type: Type.STRING },
              city: { type: Type.STRING },
              stage: { type: Type.STRING },
              industry: { type: Type.STRING },
              detailedSector: { type: Type.STRING },
              businessType: { type: Type.STRING },
              productType: { type: Type.STRING },
              elevatorPitch: { type: Type.STRING },
              businessDescription: { type: Type.STRING },
              founderBackground: { type: Type.STRING },
              teamSize: { type: Type.STRING }
            },
            required: ["companyName", "country", "city", "stage", "industry", "detailedSector", "businessType", "productType", "elevatorPitch", "businessDescription", "founderBackground", "teamSize"]
          },
          marketAnalysis: {
            type: Type.OBJECT,
            properties: {
              overview: { type: Type.STRING },
              sizeEstimate: { type: Type.STRING },
              growthTrends: { type: Type.STRING },
              demandSignals: { type: Type.STRING }
            },
            required: ["overview", "sizeEstimate", "growthTrends", "demandSignals"]
          },
          competitorAnalysis: {
            type: Type.OBJECT,
            properties: {
              mainCompetitors: { type: Type.ARRAY, items: { type: Type.STRING } },
              saturationLevel: { type: Type.STRING },
              marketGaps: { type: Type.STRING },
              competitiveAdvantages: { type: Type.STRING }
            },
            required: ["mainCompetitors", "saturationLevel", "marketGaps", "competitiveAdvantages"]
          },
          riskMatrix: {
            type: Type.OBJECT,
            properties: {
              market: { 
                type: Type.OBJECT, 
                properties: { 
                  impact: { type: Type.NUMBER }, 
                  likelihood: { type: Type.NUMBER }, 
                  explanation: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                  mitigation: { type: Type.STRING }
                },
                required: ["impact", "likelihood", "explanation", "severity", "mitigation"]
              },
              execution: { 
                type: Type.OBJECT, 
                properties: { 
                  impact: { type: Type.NUMBER }, 
                  likelihood: { type: Type.NUMBER }, 
                  explanation: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                  mitigation: { type: Type.STRING }
                },
                required: ["impact", "likelihood", "explanation", "severity", "mitigation"]
              },
              competition: { 
                type: Type.OBJECT, 
                properties: { 
                  impact: { type: Type.NUMBER }, 
                  likelihood: { type: Type.NUMBER }, 
                  explanation: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                  mitigation: { type: Type.STRING }
                },
                required: ["impact", "likelihood", "explanation", "severity", "mitigation"]
              },
              financial: { 
                type: Type.OBJECT, 
                properties: { 
                  impact: { type: Type.NUMBER }, 
                  likelihood: { type: Type.NUMBER }, 
                  explanation: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                  mitigation: { type: Type.STRING }
                },
                required: ["impact", "likelihood", "explanation", "severity", "mitigation"]
              }
            },
            required: ["market", "execution", "competition", "financial"]
          },
          swot: {
            type: Type.OBJECT,
            properties: {
              strengths: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { point: { type: Type.STRING }, why: { type: Type.STRING } },
                  required: ["point", "why"]
                },
                minItems: 3, maxItems: 4
              },
              weaknesses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { point: { type: Type.STRING }, why: { type: Type.STRING } },
                  required: ["point", "why"]
                },
                minItems: 3, maxItems: 4
              },
              opportunities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { point: { type: Type.STRING }, why: { type: Type.STRING } },
                  required: ["point", "why"]
                },
                minItems: 3, maxItems: 4
              },
              threats: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { point: { type: Type.STRING }, why: { type: Type.STRING } },
                  required: ["point", "why"]
                },
                minItems: 3, maxItems: 4
              }
            },
            required: ["strengths", "weaknesses", "opportunities", "threats"]
          },
          keyInsights: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            minItems: 3,
            maxItems: 5
          },
          growthPotential: {
            type: Type.OBJECT,
            properties: {
              scaling: { type: Type.STRING },
              revenue: { type: Type.STRING },
              revenueModel: { type: Type.STRING },
              investorAttractiveness: { type: Type.STRING }
            },
            required: ["scaling", "revenue", "revenueModel", "investorAttractiveness"]
          },
          pitchReadiness: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING },
              preview: { type: Type.STRING },
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.NUMBER },
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    points: { type: Type.ARRAY, items: { type: Type.STRING } },
                    metric: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        value: { type: Type.STRING }
                      },
                      required: ["label", "value"]
                    },
                    visualSuggestion: { type: Type.STRING },
                    imageKeywords: { type: Type.STRING },
                    colorAccent: { type: Type.STRING }
                  },
                  required: ["id", "title", "content", "points", "metric", "visualSuggestion", "imageKeywords", "colorAccent"]
                }
              }
            },
            required: ["status", "preview", "slides"]
          },
          roadmap: {
            type: Type.OBJECT,
            properties: {
              immediate: { type: Type.ARRAY, items: { type: Type.STRING } },
              oneToThreeMonths: { type: Type.ARRAY, items: { type: Type.STRING } },
              threeToSixMonths: { type: Type.ARRAY, items: { type: Type.STRING } },
              investorReadiness: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["immediate", "oneToThreeMonths", "threeToSixMonths", "investorReadiness"]
          },
          investorMatching: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                stage: { type: Type.STRING },
                focus: { type: Type.STRING },
                whyFit: { type: Type.STRING },
                matchScore: { type: Type.NUMBER }
              },
              required: ["name", "type", "stage", "focus", "whyFit", "matchScore"]
            }
          },
          topInvestorTakeaway: { type: Type.STRING },
          finalVerdict: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, enum: ["Strong Investment Opportunity", "Moderate Potential", "High Risk", "Needs Pivot", "Not Investor Ready"] },
              description: { type: Type.STRING }
            },
            required: ["status", "description"]
          }
        },
        required: ["scores", "startupProfile", "marketAnalysis", "competitorAnalysis", "riskMatrix", "keyInsights", "swot", "growthPotential", "pitchReadiness", "roadmap", "investorMatching", "finalVerdict"]
      };

      const prompt = `
        Analyze this NEW startup idea:
        "${description}"

        IMPORTANT: If the text above contains a "--- PITCH DECK CONTENT ---" section, treat it as the primary source of truth. Extract the startup name, problem, solution, business model, market, team, and financials directly from the deck. Your entire analysis must be grounded in what the deck says — not invented.

        SCORING MANDATE: Before assigning any score, re-read the idea text above. For each score dimension, identify the specific phrase or sentence that most directly justifies the number. If a dimension has no supporting evidence in the text, score it 30–50 and state that in the explanation.

        Level of detail: ${isPremium ? 'PREMIUM (Extensive deep dive)' : 'BASIC (Standard overview)'}
        
        OUTPUT STYLE:
        - Bullet points only inside lists.
        - Max 5-10 words per line.
        - No paragraphs.
        - No generic placeholder advice.
        - Write in plain, simple English. Avoid jargon, acronyms, and complex business terms.
        - Any first-time founder should understand every word without Googling it.
        
        SPECIAL ANALYSIS DIRECTIVES based on DecisionLab Dynamic Rules:
        1. Country-Specific Context: Perform dynamic calculations adjusted to local GDP per capita, internet penetration, smartphone adoption, and regulatory/investment climate of the suggested region.
        2. Stage-Specific Focus: Tailor analysis to the startup's current development stage.
        3. Competitor Benchmarking: Include direct, indirect, regional, and global competitors. Give estimated funding, positions, key strengths, of competitors, and calculate the "Startup Relative Strength Score" inside the competition explanation.
        4. Realistic Weighted Scoring: Scores must be derived from weighted factors: Market Opportunity (20%), Competitive Advantage (15%), Business Model Strength (15%), Execution Feasibility (15%), Scalability (15%), Financial Potential (10%), Risk Profile (10%).
        5. Validation Confidence: Calculate Problem/Product/Market/Revenue/Investor Attractiveness verification inside scores' explanations.
        6. Startup Success Probability: Estimate based on country-level survival rates, team maturity, and failure factors. Group into Low/Moderate/High confidence and explain assumptions.
        7. Market Research: Calculate precise numeric estimates for TAM, SAM, and SOM in the marketAnalysis. Include CAGR and outlook trends.
        8. Investor Readiness: Formulate an Investor Interest Score based on exit potential and feasibility, detailing the likelihood of raising Seed, Series A, or strategic acquisition.
        9. Risk Engine: Classify and grade Market, Product, Financial, Operational, Regulatory, and Competitive risks. Provide Severity % and Probability % in explanations.
        10. Growth Roadmap: Outline actionable 30-day, 90-day, 6-month, and 12-month plans aligned with weaknesses.
        
        KEY INSIGHTS:
        - Provide 4 insights.
        - Format: "[Priority] Short Insight".
        - Priority must be High, Medium, or Low.
        - Max 10 words per insight.
        - Write in plain English — no jargon, no acronyms.
        - Each insight must be something any non-expert founder immediately understands.
        - Example good: "[High] Small businesses struggle to afford legal help."
        - Example bad: "[High] SME legal budget constraints limit addressable market penetration."
    
        STRATEGIC ROADMAP:
        - Provide specific and measurable actions.
        - Use numbers, targets, and clear outcomes.
        - Align with weak metrics and address biggest risks first.
    
        TOP INVESTOR TAKEAWAY:
        - One strong, definitive sentence summary of the investment case.
        
        METRIC RADAR:
        Generate unique variable scores (0-100) and a short 5-10 word explanation for: Idea Strength, Market Fit, Execution, Scalability, Competition, Investor Appeal.
        
        RISK MATRIX:
        Impact (1-10), Likelihood (1-10), and a short note for: Market, Execution, Competition, Financial risks.
        
        PITCH DECK ARCHITECT:
        Generate a 12-slide structured narrative with cover, problem, solution, market, business model, competition, go-to-market, traction, financials, team, investment ask.
        Each slide should have 2-4 short bullets.
        
        STARTUP PROFILE:
        Suggest a complete company identity based on the idea.
        PREFERRED SELECTIONS:
        - stage: Idea Stage, Research Phase, Prototype, MVP, Beta Launch, Early Traction, Revenue Generating, Seed Stage, Growth Stage, Scaling, Series A Ready, Established Business.
        - industry: Artificial Intelligence, Fintech, SaaS, Healthcare, HealthTech, EdTech, Cybersecurity, E-commerce, Marketplace, Logistics, FoodTech, PropTech, LegalTech, HRTech, ClimateTech, BioTech, Robotics, Gaming, Creator Economy, Social Platform, Productivity, Enterprise Software, Real Estate, TravelTech, Transportation, FashionTech, AgriTech, SportsTech, Media & Entertainment, Web3 / Blockchain, IoT, Manufacturing, Telecommunications, Consumer Electronics, Energy, Hospitality, GovernmentTech, Nonprofit / Social Impact.
        - productType: SaaS Platform, Mobile App, Web Platform, Marketplace Platform, Intelligent Tool, API, Enterprise Software, Consumer App, Hardware Device, Hardware + Software, Chrome Extension, Automation Tool, Analytics Platform, Developer Tool, E-learning Platform, Social Platform, IoT Product, Robotics System, Cloud Infrastructure, No-Code Platform.
        - teamSize: Solo, 2–5, 6–10, 10+
        - businessType: B2B, B2C, B2B2C, Marketplace, D2C
      `;

      const result = await geminiGenerateContent(client, {
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema as any,
          temperature: 0
        }
      }, key);

      const parsed = JSON.parse(result.text || '{}');
      res.json(parsed);
    } catch (error: any) {
      console.error("Express Gemini Analyze Idea Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API proxy endpoint for generating company-level analysis via Gemini
  app.post("/api/gemini/generate-company-analysis", async (req, res) => {
    const { profile } = req.body;
    if (!profile) return res.status(400).json({ error: 'Profile is required' });

    {
      const authHeader = req.headers.authorization || '';
      const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      if (!idToken) return res.status(401).json({ error: 'Unauthorized' });
      if (!useAdminSdk) return res.status(503).json({ error: 'Auth unavailable' });
      try { await getAdminAuth().verifyIdToken(idToken); }
      catch { return res.status(401).json({ error: 'Unauthorized' }); }
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing on the server' });
    }

    try {
      const { GoogleGenAI, Type } = await import("@google/genai");
      const client = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const getInputHash = (str: string): number => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = (hash << 5) - hash + str.charCodeAt(i);
          hash |= 0; 
        }
        return Math.abs(hash) % 1000;
      };

      const splitLocation = (p: any): { city: string; country: string } => {
        if (p.city || p.country) {
          return { city: p.city || '', country: p.country || '' };
        }
        const raw = (p.location || '').trim();
        if (!raw) return { city: '', country: '' };

        const KNOWN_CITIES: Record<string, string> = {
          'DUBAI': 'United Arab Emirates',
          'ABU DHABI': 'United Arab Emirates',
          'RIYADH': 'Saudi Arabia',
          'JEDDAH': 'Saudi Arabia',
          'AL KHOBAR': 'Saudi Arabia',
          'MANAMA': 'Bahrain',
          'DOHA': 'Qatar',
          'KUWAIT CITY': 'Kuwait',
          'CAIRO': 'Egypt',
          'SINGAPORE': 'Singapore',
          'NEW YORK': 'USA',
          'TOKYO': 'Japan',
          'BERLIN': 'Germany',
          'MUNICH': 'Germany',
          'FRANKFURT': 'Germany',
          'PARIS': 'France',
          'SAN FRANCISCO': 'USA',
          'LONDON': 'United Kingdom',
          'AMSTERDAM': 'Netherlands',
          'TORONTO': 'Canada',
          'MUMBAI': 'India',
          'SYDNEY': 'Australia',
          'SAO PAULO': 'Brazil',
          'SHANGHAI': 'China',
          'HONG KONG': 'Hong Kong',
          'SEOUL': 'South Korea',
          'AUSTIN': 'USA',
          'BOSTON': 'USA',
          'LOS ANGELES': 'USA',
          'CHICAGO': 'USA',
          'SEATTLE': 'USA',
          'STOCKHOLM': 'Sweden',
          'ZURICH': 'Switzerland',
          'GENEVA': 'Switzerland',
          'DUBLIN': 'Ireland',
          'BARCELONA': 'Spain',
          'MADRID': 'Spain',
        };

        const upper = raw.toUpperCase();
        const matchedCity = Object.keys(KNOWN_CITIES).find(city => upper.startsWith(city));
        if (matchedCity) {
          return { city: matchedCity, country: KNOWN_CITIES[matchedCity] };
        }

        return { city: raw, country: raw };
      };

      const { city: resolvedCity, country: resolvedCountry } = splitLocation(profile);

      // Map the ACTUAL fields the dashboard profile form sends. Previously this
      // handler only read profile.name / profile.tagline / profile.description,
      // none of which the form sends — so the founder's Startup Story, Elevator
      // Pitch and Founder Background never reached the model and could not move
      // the score. We now read the real field names and pass all of it through.
      const cName = profile.companyName || profile.name || 'Unnamed Venture';
      const cStage = profile.startupStage || profile.stage || 'Idea Stage';
      const cIndustry = profile.industry || 'General Tech';
      const startupStory = profile.companyDescription || profile.description || '';
      const elevatorPitch = profile.pitchSummary || profile.tagline || '';
      const founderBackground = profile.founderInfo || '';
      const cBusinessType = profile.businessType || '';
      const cProductType = profile.productType || '';
      const cSectors = Array.isArray(profile.sectors) ? profile.sectors.join(', ') : (profile.sectors || '');

      // Summarize the structured team for the model.
      let teamSummary = '';
      if (Array.isArray(profile.teamStructure) && profile.teamStructure.length > 0) {
        teamSummary = profile.teamStructure.map((m: any) =>
          `${m.name || 'Unnamed'} — ${m.role || 'Member'}, ${m.experience || 0} yrs${m.specialty && m.specialty.length ? ', ' + m.specialty.join('/') : ''}`
        ).join('; ');
      } else if (profile.teamMembers) {
        teamSummary = String(profile.teamMembers);
      }

      // How complete is the founder brief? This directly drives the score band:
      // a rich, specific brief earns a higher ceiling; a thin/empty one is
      // capped lower. Word count (not the raw text) decides the band.
      const briefWordCount = `${startupStory} ${elevatorPitch} ${founderBackground}`
        .trim().split(/\s+/).filter(Boolean).length;
      let briefDepth = 'MINIMAL';
      if (briefWordCount >= 120) briefDepth = 'COMPREHENSIVE';
      else if (briefWordCount >= 60) briefDepth = 'MODERATE';
      else if (briefWordCount >= 20) briefDepth = 'BASIC';

      // Seed now varies with the actual founder brief, so editing the profile
      // produces a genuinely different analysis instead of the same numbers.
      const seedString = `${cName}-${cIndustry}-${cStage}-${startupStory}-${elevatorPitch}-${founderBackground}`;
      const uniqueSeed = getInputHash(seedString);

      const systemInstruction = `
        You are DecisionLab's Venture Capital Analyst. Your ONLY job is to evaluate what the founder has actually written — nothing more.

        ### THE GOLDEN RULE — EVIDENCE FIRST:
        Every score and every sentence of analysis MUST be traceable to something the founder explicitly stated in their Startup Story, Elevator Pitch, Founder Background, or the structured fields (industry, stage, location, team).
        - If the founder did NOT mention it, do NOT assume it, invent it, or give credit for it.
        - If a field is empty or says "NOT PROVIDED", you MUST treat it as unknown and score it conservatively.
        - Never fill gaps with "typically in this industry…" or generic statements. State what is missing.

        ### EVIDENCE-BASED SCORING RUBRIC (0–100 integers only):
        Score each dimension by counting concrete evidence the founder provided:

        ideaStrength (Is the problem real and clearly described?):
        - 80–100: Founder describes a specific, painful problem with real examples or data. Clear who suffers from it and why existing solutions fail.
        - 60–79: Problem is mentioned but vague or broad. No data or specific examples.
        - 40–59: Problem is implied but not clearly articulated.
        - 0–39: No clear problem statement, or just buzzwords with no substance.

        marketFit (Is there a clear, sizeable market that wants this?):
        - 80–100: Founder identifies specific target customers, mentions real market size, demand signals, or early users.
        - 60–79: Market is mentioned generally without specifics.
        - 40–59: Market is vague or implied.
        - 0–39: No market defined, or the market is unclear/too small.

        execution (Can this team realistically build and sell this?):
        - 80–100: Founder has directly relevant experience. Team has the skills needed. Progress already made (prototype, customers, revenue).
        - 60–79: Some relevant background mentioned. Team partially formed.
        - 40–59: Generic or unrelated background. Team is solo or unspecified.
        - 0–39: No background provided, no team, no evidence of execution capability.

        scalability (Can this grow without costs growing equally?):
        - 80–100: Business model clearly allows growth without proportional cost increase. Digital product, platform, or software with network effects.
        - 60–79: Some scalability potential described but vague.
        - 40–59: Scalability unclear or depends on manual effort.
        - 0–39: Highly manual, local, or service-dependent with no scalable model described.

        competition (How defensible is this against competitors?):
        - 80–100: Founder names competitors and explains a specific, credible advantage (patent, data, distribution, unique technology, pricing).
        - 60–79: Acknowledges competition with general differentiation claim.
        - 40–59: Competition not addressed or differentiation is generic.
        - 0–39: No competitive awareness shown. Assumes no competition.

        investorAppeal (Would an investor find this compelling based on what was written?):
        - 80–100: Strong problem, clear solution, believable team, some evidence of demand. Investor could form a thesis from this.
        - 60–79: Interesting but missing key evidence investors need.
        - 40–59: Weak pitch with little substance to evaluate.
        - 0–39: Too thin, too generic, or contradictory to generate investor interest.

        ### REAL-WORLD BENCHMARKING (CRITICAL FOR FAIR SCORING):
        Use your knowledge of real startups, funded companies, and actual market conditions to calibrate every score against what truly exists in the world. Do not score in a vacuum.

        For each startup, before scoring ask:
        - Does a well-funded company already doing this exact thing exist? If yes and no clear differentiation is stated, competition score must be low (20–40).
        - How crowded is this space? (e.g., food delivery, social media, e-commerce are extremely crowded — low competition scores unless a real edge is described).
        - What do real startups in this industry look like at this stage? Compare to actual funded examples you know.
        - Is the market size claim realistic based on actual industry data?
        - Has this type of idea been tried before and failed? If yes, mention it in the explanation.

        BENCHMARK CALIBRATION EXAMPLES (use as reference points):
        - Idea identical to a well-funded global company (Airbnb, Uber, Stripe, Shopify, etc.) with no differentiation: competition 15–35, ideaStrength 30–55.
        - Idea in a genuinely underserved local niche with specific evidence: marketFit 70–85.
        - Overcrowded space (food delivery, generic social app, generic e-commerce) with no stated edge: competition 15–40.
        - Real, painful, verifiable problem with no known large-scale solution: ideaStrength 75–90.
        - Solo founder at idea stage with no background mentioned: execution 25–45 regardless of idea.
        - Team with directly relevant domain experience: execution 65–85.
        - Idea in a regulated industry (fintech, healthcare, legal) without mentioning compliance: execution and scalability deducted 10–20 points.

        Always mention in the score explanation which real companies, market conditions, or industry facts you compared this to.

        ### SCORING RULES:
        1. Each score explanation MUST: (a) quote specific words from the founder's input AND (b) name the real-world comparison or market fact that calibrated the score.
        2. Use exact integers (e.g., 67, 74, 83) — not rounded numbers like 60, 70, 80.
        3. Do NOT give the same score to two dimensions unless the evidence genuinely supports the same level.
        4. If the founder wrote less than 20 words total, cap ALL scores at 45.
        5. A score above 80 requires BOTH strong founder evidence AND a favorable real-world market position.

        ### COUNTRY & STAGE ADJUSTMENT:
        After benchmarking, apply:
        - Country: Adjust marketFit and investorAppeal based on local startup ecosystem maturity, investment climate, and GDP per capita.
        - Stage: Do not penalize idea-stage founders for lacking revenue — evaluate what is realistic for their stage.

        ### SWOT: Each item must reference something the founder actually said AND a real market or competitive fact. No generic items.

        ### OUTPUT STYLE:
        - Plain English a first-time founder can understand. No jargon.
        - Replace: TAM→"total market size", CAC→"cost to get one customer", LTV→"value per customer", SaaS→"software subscription", B2B→"business customers", MVP→"first version", KPIs→"key goals", ROI→"profit on investment", churn→"customers leaving", runway→"months of money left", scalable→"can grow without huge extra costs", traction→"early proof customers want this".
        - Short and specific. Max 10-12 words per bullet.
        - Always name the company specifically — never say "your startup".

        ### FORMATTING RULES (STRICT):
        - Do NOT end any bullet point or list item with a period or full stop.
        - Do NOT use hyphens (-, –, —) at the start of sentences or as bullet markers in text fields.
        - Do NOT use em-dashes or en-dashes inside sentences unless absolutely required for meaning.
        - Write list items as short natural phrases, not punctuated sentences.
        - No trailing punctuation on list items at all.
      `;

      const healthScoreSchema = {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          explanation: { type: Type.STRING }
        },
        required: ["score", "explanation"]
      };

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          scores: {
            type: Type.OBJECT,
            properties: {
              ideaStrength: healthScoreSchema,
              marketFit: healthScoreSchema,
              execution: healthScoreSchema,
              investorAppeal: healthScoreSchema,
              scalability: healthScoreSchema,
              competition: healthScoreSchema
            },
            required: ["ideaStrength", "marketFit", "execution", "investorAppeal", "scalability", "competition"]
          },
          funding: {
            type: Type.OBJECT,
            properties: {
              stage: { type: Type.STRING },
              readinessScore: { type: Type.NUMBER },
              gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
              verdict: { type: Type.STRING }
            },
            required: ["stage", "readinessScore", "gaps", "verdict"]
          },
          investorMatching: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                whyFit: { type: Type.STRING },
                stage: { type: Type.STRING },
                focus: { type: Type.STRING },
                suggestedPitch: { type: Type.STRING },
                whatTheyLookFor: { type: Type.STRING },
                matchScore: { type: Type.NUMBER }
              },
              required: ["name", "type", "whyFit", "stage", "focus", "suggestedPitch", "whatTheyLookFor", "matchScore"]
            }
          },
          traction: {
            type: Type.OBJECT,
            properties: {
              analysis: { type: Type.STRING },
              nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
              potential: { type: Type.STRING }
            },
            required: ["analysis", "nextSteps", "potential"]
          },
          riskMatrix: {
            type: Type.OBJECT,
            properties: {
              market: { 
                type: Type.OBJECT, 
                properties: { 
                  explanation: { type: Type.STRING }, 
                  severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                  impact: { type: Type.NUMBER },
                  likelihood: { type: Type.NUMBER },
                  mitigation: { type: Type.STRING }
                }, 
                required: ["explanation", "severity", "impact", "likelihood", "mitigation"] 
              },
              execution: { 
                type: Type.OBJECT, 
                properties: { 
                  explanation: { type: Type.STRING }, 
                  severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                  impact: { type: Type.NUMBER },
                  likelihood: { type: Type.NUMBER },
                  mitigation: { type: Type.STRING }
                }, 
                required: ["explanation", "severity", "impact", "likelihood", "mitigation"] 
              },
              competition: { 
                type: Type.OBJECT, 
                properties: { 
                  explanation: { type: Type.STRING }, 
                  severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                  impact: { type: Type.NUMBER },
                  likelihood: { type: Type.NUMBER },
                  mitigation: { type: Type.STRING }
                }, 
                required: ["explanation", "severity", "impact", "likelihood", "mitigation"] 
              },
              financial: { 
                type: Type.OBJECT, 
                properties: { 
                  explanation: { type: Type.STRING }, 
                  severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                  impact: { type: Type.NUMBER },
                  likelihood: { type: Type.NUMBER },
                  mitigation: { type: Type.STRING }
                }, 
                required: ["explanation", "severity", "impact", "likelihood", "mitigation"] 
              }
            },
            required: ["market", "execution", "competition", "financial"]
          },
          swot: {
            type: Type.OBJECT,
            properties: {
              strengths: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { point: { type: Type.STRING }, why: { type: Type.STRING } },
                  required: ["point", "why"]
                },
                minItems: 3, maxItems: 4
              },
              weaknesses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { point: { type: Type.STRING }, why: { type: Type.STRING } },
                  required: ["point", "why"]
                },
                minItems: 3, maxItems: 4
              },
              opportunities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { point: { type: Type.STRING }, why: { type: Type.STRING } },
                  required: ["point", "why"]
                },
                minItems: 3, maxItems: 4
              },
              threats: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { point: { type: Type.STRING }, why: { type: Type.STRING } },
                  required: ["point", "why"]
                },
                minItems: 3, maxItems: 4
              }
            },
            required: ["strengths", "weaknesses", "opportunities", "threats"]
          },
          keyInsights: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            minItems: 3,
            maxItems: 5
          },
          roadmap: {
            type: Type.OBJECT,
            properties: {
              immediate: { type: Type.ARRAY, items: { type: Type.STRING } },
              oneToThreeMonths: { type: Type.ARRAY, items: { type: Type.STRING } },
              threeToSixMonths: { type: Type.ARRAY, items: { type: Type.STRING } },
              investorReadiness: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["immediate", "oneToThreeMonths", "threeToSixMonths", "investorReadiness"]
          },
          finalVerdict: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, enum: ["Strong Investment Opportunity", "Moderate Potential", "High Risk", "Needs Pivot", "Not Investor Ready"] },
              description: { type: Type.STRING }
            },
            required: ["status", "description"]
          },
          pitchDeckRecommendation: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, enum: ["Recommended: Generate Professional Pitch Deck", "Recommended: Improve idea before generating pitch deck"] },
              isStrongPotential: { type: Type.BOOLEAN }
            },
            required: ["status", "isStrongPotential"]
          },
          investorReadinessRouting: { 
            type: Type.STRING, 
            enum: ["Not ready for VC", "Seed Target", "Series A Expansion Target"] 
          }
        },
        required: [
          "summary", "scores", "funding", "investorMatching", "traction", 
          "riskMatrix", "keyInsights", "swot", "roadmap", "finalVerdict", 
          "pitchDeckRecommendation", "investorReadinessRouting"
        ]
      };

      const dynamicPrompt = `
        Conduct a highly intensive company profile mapping and threat analysis for the following startup instance:
        
        - Company Name: "${cName}"
        - Current Stage: "${cStage}"
        - Sector/Industry Cluster: "${cIndustry}"
        - Detailed Sectors: "${cSectors}"
        - Revenue / Business Model: "${cBusinessType}"
        - Product Architecture: "${cProductType}"
        - Context Target Coordinates: City: ${resolvedCity}, Country: ${resolvedCountry}
        - Team: ${teamSummary || 'Not specified'}

        FOUNDER BRIEF (the founder's own words — weight this heavily in every score):
        - Startup Story: "${startupStory || 'NOT PROVIDED'}"
        - Elevator Pitch: "${elevatorPitch || 'NOT PROVIDED'}"
        - Founder Background: "${founderBackground || 'NOT PROVIDED'}"

        FOUNDER BRIEF DEPTH: ${briefDepth} (${briefWordCount} words total)

        SCORING IMPACT DIRECTIVE — THE FOUNDER BRIEF MUST RAISE OR LOWER THE SCORE:
        The depth, specificity, and credibility of the Founder Brief above MUST directly drive every score.
        - COMPREHENSIVE brief (clear problem, differentiated solution, concrete numbers, real founder expertise): award HIGH scores (typically 80-95 where genuinely justified).
        - MODERATE brief: mid-range scores (60-79).
        - BASIC brief: cautious scores (45-65).
        - MINIMAL or "NOT PROVIDED": you MUST penalize with LOW scores (25-50), and each explanation must state that the score is limited by insufficient founder-provided detail.
        Map fields to scores: ideaStrength and execution depend on the Startup Story and Founder Background; investorAppeal depends on how compelling the Elevator Pitch and founder credibility are; marketFit and scalability depend on the clarity of the problem and solution described. Reward concrete, specific, credible detail; penalize vagueness, buzzwords, or empty fields. NEVER give a strong score to a thin or empty brief.

        SCORING MANDATE:
        Before writing any score, re-read the Founder Brief above. For each of the 6 score dimensions, identify the specific sentence or phrase from the founder's text that most directly affects that score, and use that as the basis. If a dimension has no supporting evidence in the founder's text, score it in the 30–50 range and say so in the explanation.

        Apply country-specific ecosystem weighting for ${resolvedCountry}: local investment climate, startup survival rates, and market size all affect marketFit and investorAppeal scores.
        Apply stage-specific expectations for "${cStage}": do not penalize early-stage founders for lacking revenue or large teams — evaluate what is realistic for this stage.
      `;

      const result = await geminiGenerateContent(client, {
        contents: dynamicPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema as any,
          temperature: 0
        }
      }, key);

      const parsed = JSON.parse(result.text || '{}');
      res.json(parsed);
    } catch (error: any) {
      console.error("Express Gemini Company Analysis Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API proxy endpoint for Venture Operator chat
  app.post("/api/gemini/venture-operator", async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    {
      const authHeader = req.headers.authorization || '';
      const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      if (!idToken) return res.status(401).json({ error: 'Unauthorized' });
      if (!useAdminSdk) return res.status(503).json({ error: 'Auth unavailable' });
      try { await getAdminAuth().verifyIdToken(idToken); }
      catch { return res.status(401).json({ error: 'Unauthorized' }); }
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing on the server' });
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const client = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `
        You are the "Venture Operator" for DecisionLab. 
        CORE PROTOCOL: Respond with absolute executive brevity. No filler. No storytelling. No conversational pleasantries.
        
        STRUCTURE:
        1. [DIRECT_RESPONSE]: 1 concise sentence.
        2. [STRATEGIC_INSIGHT]: 1-2 sharp bullet points using premium terminology.
        3. [RECOMMENDED_MOTION]: 1 high-leverage action.

        TONE: Premium, sharp, confident, analytical.
        LANG: Venture-focused.
        
        System Context: DecisionLab venture analysis core.
        User Command: ${message}
      `;

      const response = await geminiGenerateContent(client, {
        contents: prompt,
        config: {
          systemInstruction: "You are an elite venture analyst. Output must be structured as: Direct Answer, Strategic Insight, and Recommendation. Total brevity mandatory."
        }
      }, key);

      res.json({ text: response.text || "I'm sorry, I encountered an error. Please try again." });
    } catch (error: any) {
      console.error("Venture Operator Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    app.get('/robots.txt', (_req, res) => {
      res.type('text/plain').send(
        'User-agent: *\nAllow: /\nSitemap: https://decisionlabhub.com/sitemap.xml'
      );
    });

    app.get('/sitemap.xml', (_req, res) => {
      const now = new Date().toISOString().split('T')[0];
      const pages = ['', 'about', 'pricing', 'contact'];
      const urls = pages.map(p =>
        `<url><loc>https://decisionlabhub.com/${p}</loc><lastmod>${now}</lastmod><changefreq>${p === '' ? 'daily' : 'weekly'}</changefreq><priority>${p === '' ? '1.0' : '0.7'}</priority></url>`
      ).join('\n  ');
      res.type('application/xml').send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ${urls}\n</urlset>`
      );
    });

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();