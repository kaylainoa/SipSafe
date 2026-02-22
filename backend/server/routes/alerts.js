const express = require("express");
const nodemailer = require("nodemailer");

const router = express.Router();

const CARRIER_GATEWAYS = {
  att: ["txt.att.net", "mms.att.net"],
  verizon: ["vtext.com", "vzwpix.com"],
  tmobile: ["tmomail.net"],
  sprint: ["messaging.sprintpcs.com", "pm.sprint.com"],
  boost: ["sms.myboostmobile.com", "myboostmobile.com"],
  cricket: ["sms.cricketwireless.net", "mms.cricketwireless.net"],
  uscellular: ["email.uscc.net", "mms.uscc.net"],
  metropcs: ["mymetropcs.com"],
  virgin: ["vmobl.com"],
  visible: ["vtext.com"],
};

function normalizePhone10(rawPhone) {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

function toGatewayAddress(phone, carrier) {
  const number = normalizePhone10(phone);
  const key = String(carrier || "").trim().toLowerCase();
  const domains = CARRIER_GATEWAYS[key];
  if (!number) return { ok: false, error: "Invalid US phone number." };
  if (!domains) {
    return {
      ok: false,
      error:
        "Unsupported or missing carrier. Supported: att, verizon, tmobile, sprint, boost, cricket, uscellular, metropcs, virgin, visible.",
    };
  }
  return { ok: true, emails: domains.map((domain) => `${number}@${domain}`) };
}

router.post("/emergency-sms", async (req, res) => {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const smtpFrom = process.env.SMTP_FROM?.trim() || smtpUser;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpFrom) {
    return res.status(500).json({
      error:
        "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.",
    });
  }

  const contacts = Array.isArray(req.body?.contacts) ? req.body.contacts : [];
  const message = String(req.body?.message || "").trim();
  if (contacts.length === 0) {
    return res.status(400).json({ error: "At least one contact is required." });
  }
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const results = await Promise.all(
    contacts.map(async (contact) => {
      const to = toGatewayAddress(contact?.phone, contact?.carrier);
      if (!to.ok) {
        return {
          ok: false,
          to: String(contact?.phone || ""),
          error: to.error,
        };
      }
      let lastSendError = null;
      for (const email of to.emails) {
        try {
          const mailResult = await transporter.sendMail({
            to: email,
            from: smtpFrom,
            subject: "SipSafe Alert",
            text: message.slice(0, 300),
          });
          return { ok: true, to: email, sid: mailResult.messageId || "queued" };
        } catch (error) {
          lastSendError = error instanceof Error ? error.message : "Unknown send error";
        }
      }
      {
        return {
          ok: false,
          to: to.emails.join(" | "),
          error: `All carrier gateways failed. ${lastSendError || "Email-to-SMS send failed."}`,
        };
      }
    })
  );

  const sent = results.filter((r) => r.ok).map((r) => ({ to: r.to, sid: r.sid }));
  const failed = results
    .filter((r) => !r.ok)
    .map((r) => ({ to: r.to, error: r.error || "Failed" }));

  return res.json({
    ok: true,
    attempted: contacts.length,
    sent,
    failed,
  });
});

module.exports = router;
