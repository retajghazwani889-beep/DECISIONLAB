import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('Email system bypass: SMTP credentials not configured.');
        return res.json({ success: true, message: 'Notification skipped (not configured)' });
      }

      if (type === 'welcome') {
        const { email, fullName } = userData;
        const firstName = fullName.split(' ')[0];
        
        if (process.env.SMTP_USER) {
          await transporter.sendMail({
            from: process.env.SMTP_FROM,
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

          // Send admin notification
          await transporter.sendMail({
            from: process.env.SMTP_FROM,
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
    } catch (error) {
      console.error('Email notification failed:', error);
      // We don't want to break the signup flow if email fails, but we should log it
      res.json({ success: false, error: 'Email service unavailable' });
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
