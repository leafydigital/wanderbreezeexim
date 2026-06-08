// @ts-nocheck

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Send via Gmail SMTP using nodemailer-compatible raw SMTP ──
// Deno doesn't have nodemailer, so we use the Gmail API via OAuth
// or simpler: use smtp2go / resend. Here we use fetch to Gmail SMTP
// via a simple SMTP-over-HTTP relay approach.
//
// Actually for Deno Edge Functions, we use the Resend API or
// direct SMTP via a TCP connection. The simplest reliable approach
// is to use the Gmail SMTP credentials via the smtp library.

async function sendViaGmail(params: {
  to: string[];
  subject: string;
  html: string;
  attachments?: { filename: string; content: string; encoding: string }[];
  gmailUser: string;
  gmailPass: string;
}): Promise<{ success: boolean; error?: string }> {

  // Use smtp.js approach via a simple HTTP SMTP relay
  // We'll use the MailChannels API which is available in Cloudflare/Deno
  // OR use Gmail's SMTP via fetch with base64 encoded MIME

  const { to, subject, html, attachments = [], gmailUser, gmailPass } = params;

  // Build MIME message
  const boundary = `boundary_${Date.now()}`;
  const toStr = to.join(", ");

  let mimeBody = [
    `From: "Wander Breeze Exim" <${gmailUser}>`,
    `To: ${toStr}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="utf-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    btoa(unescape(encodeURIComponent(html))),
  ].join("\r\n");

  for (const att of attachments) {
    mimeBody += [
      ``,
      `--${boundary}`,
      `Content-Type: application/pdf; name="${att.filename}"`,
      `Content-Disposition: attachment; filename="${att.filename}"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      att.content,
    ].join("\r\n");
  }

  mimeBody += `\r\n--${boundary}--`;

  // Gmail API send via OAuth2 or App Password
  // Using Gmail SMTP REST endpoint with base64 encoded RFC 2822 message
  const encodedMessage = btoa(unescape(encodeURIComponent(mimeBody)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Use Gmail API with basic auth (app password)
  // Actually we'll use a simpler approach: POST to Gmail's SMTP
  // via the smtplib-compatible HTTP endpoint

  // The most reliable approach for Deno: use fetch to call
  // an SMTP-to-HTTP gateway. We'll implement direct SMTP via TCP.

  try {
    // Use Resend as primary (most reliable in Deno/Edge)
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Wander Breeze Exim <${gmailUser}>`,
          to,
          subject,
          html,
          attachments: attachments.map(a => ({
            filename: a.filename,
            content: a.content,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) return { success: true };
      return { success: false, error: data.message || "Resend failed" };
    }

    // Fallback: Gmail SMTP via smtp.google.com using fetch + basic auth
    // Use Gmail's API endpoint
    const gmailRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${gmailUser}:${gmailPass}`)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: encodedMessage }),
      }
    );

    if (gmailRes.ok) return { success: true };
    const err = await gmailRes.json().catch(() => ({}));
    return { success: false, error: err.error?.message || "Gmail API failed" };

  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Replace dynamic tags in template ─────────────────────────
function replaceTags(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\[${key}\\]`, "gi");
    result = result.replace(regex, value || "");
  }
  return result;
}

// ── Main handler ─────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      action,
      recipients,   // [{ id, company_name, email, country, ... }]
      subject,
      body: emailBody,
      attachments = [],  // [{ filename, content (base64) }]
    } = body;

    if (action !== "send") return json({ error: "Unknown action" }, 400);
    if (!recipients?.length) return json({ error: "No recipients" }, 400);
    if (!emailBody) return json({ error: "Email body required" }, 400);

    const gmailUser = Deno.env.get("GMAIL_USER") || "";
    const gmailPass = Deno.env.get("GMAIL_PASS") || "";

    const results: { id: string; success: boolean; error?: string }[] = [];
    const DELAY = 4000; // 4 sec between emails (same as original script)

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const emails = recipient.email
        ? recipient.email.split("|").map((e: string) => e.trim()).filter(Boolean)
        : [];

      if (!emails.length) {
        results.push({ id: recipient.id, success: false, error: "No email address" });
        continue;
      }

      // Personalize subject and body
      const tags: Record<string, string> = {
        "Company Name": recipient.company_name || "Team",
        "Country":      recipient.country      || "",
        "Contact Name": recipient.contact_name || recipient.company_name || "Team",
        "Website":      recipient.website      || "",
        "Category":     recipient.category     || "",
      };

      const personalizedSubject = replaceTags(subject, tags);
      const personalizedBody    = replaceTags(emailBody, tags);

      const result = await sendViaGmail({
        to: emails,
        subject: personalizedSubject,
        html: personalizedBody,
        attachments,
        gmailUser,
        gmailPass,
      });

      results.push({ id: recipient.id, ...result });
      console.log(`[send-email] ${i + 1}/${recipients.length} — ${recipient.company_name}: ${result.success ? "✓" : "✗ " + result.error}`);

      // Delay between sends (skip delay on last email)
      if (i < recipients.length - 1) {
        await new Promise(r => setTimeout(r, DELAY));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount    = results.filter(r => !r.success).length;

    return json({
      success: true,
      sent:    successCount,
      failed:  failCount,
      results,
    });

  } catch (err: any) {
    console.error("[send-email] Fatal:", err);
    return json({ error: "Internal server error", detail: err.message }, 500);
  }
});
