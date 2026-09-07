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
      subject: 'Verify your Mobile Store account',
      html: `<p>Hi ${name},</p><p>Your Mobile Store verification code is:</p><h1 style="letter-spacing: 4px;">${otp}</h1><p>This code expires in 10 minutes. Do not share it with anyone.</p>`,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || 'Unable to send the verification email');
  }
}

module.exports = { sendRegistrationOtp };
