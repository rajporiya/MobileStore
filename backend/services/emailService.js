// Escape user input so values like <script> render as text, never as markup.
function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Table-based layout with inline styles: the only markup that renders
// reliably across Gmail, Outlook, and Apple Mail.
function buildOtpEmailHtml({ name, otp }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>Verify your VoltCart account</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:0 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#4f46e5;border-radius:12px;width:44px;height:44px;text-align:center;font-size:20px;font-weight:800;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">V</td>
                  <td style="padding-left:10px;font-size:22px;font-weight:800;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">VoltCart</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;padding:40px 40px 36px;">
              <h1 style="margin:0 0 10px;font-size:24px;line-height:32px;font-weight:800;color:#0f172a;">Verify your email</h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:24px;color:#475569;">
                Hi ${escapeHtml(name)}, thanks for signing up for VoltCart.
                Enter the verification code below to finish creating your account.
              </p>

              <!-- OTP code -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color:#eef2ff;border:1px solid #e0e7ff;border-radius:14px;padding:28px 20px;">
                    <div style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6366f1;margin-bottom:10px;">Verification code</div>
                    <div style="font-size:38px;line-height:44px;font-weight:800;letter-spacing:14px;text-indent:14px;color:#312e81;">${escapeHtml(otp)}</div>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:14px;line-height:22px;color:#64748b;">
                This code expires in <strong style="color:#0f172a;">10 minutes</strong>.
                Each code works only once.
              </p>
              <p style="margin:12px 0 0;font-size:14px;line-height:22px;color:#64748b;">
                Didn't request this? Someone may have typed your email by mistake —
                you can safely ignore this message.
              </p>

              <!-- Tip -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
                <tr>
                  <td style="background-color:#f8fafc;border-radius:10px;padding:14px 16px;font-size:13px;line-height:20px;color:#64748b;">
                    🔒 Tip: never share this code with anyone — the VoltCart team will never ask for it.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 16px 0;">
              <p style="margin:0 0 6px;font-size:12px;line-height:18px;color:#94a3b8;">
                VoltCart — buy and sell smartphones with confidence.
              </p>
              <p style="margin:0;font-size:12px;line-height:18px;color:#cbd5e1;">
                This is an automated message. Replies to this address are not monitored.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildOtpEmailText({ name, otp }) {
  return [
    `Hi ${name},`,
    '',
    'Thanks for signing up for VoltCart. Your verification code is:',
    '',
    otp,
    '',
    'This code expires in 10 minutes and works only once.',
    "If you didn't request it, you can safely ignore this email.",
  ].join('\n');
}

async function sendRegistrationOtp({ email, name, otp }) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error('Email OTP is not configured. Set RESEND_API_KEY and EMAIL_FROM.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: `${otp} is your VoltCart verification code`,
      html: buildOtpEmailHtml({ name, otp }),
      text: buildOtpEmailText({ name, otp }),
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || 'Unable to send the verification email');
  }
}

module.exports = { sendRegistrationOtp };
