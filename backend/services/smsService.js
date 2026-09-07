function toSmsNumber(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  const countryCode = String(process.env.SMS_DEFAULT_COUNTRY_CODE || '91').replace(/\D/g, '');
  return `+${digits.length === 10 ? `${countryCode}${digits}` : digits}`;
}

function isConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID)
  );
}

async function sendOrderSms(order) {
  if (!isConfigured()) return { skipped: true, reason: 'SMS is not configured' };

  const to = toSmsNumber(order.shippingAddress?.phone);
  if (!to) throw new Error('The order has no valid SMS phone number');

  const orderNumber = order._id.toString().slice(-8).toUpperCase();
  const total = Number(order.totalPrice).toLocaleString('en-IN');
  const body = `Mobile Store: Hi ${order.shippingAddress.fullName}, your order #${orderNumber} for INR ${total} has been placed successfully.`;
  const requestBody = new URLSearchParams({ To: to, Body: body });

  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    requestBody.set('MessagingServiceSid', process.env.TWILIO_MESSAGING_SERVICE_SID);
  } else {
    requestBody.set('From', process.env.TWILIO_PHONE_NUMBER);
  }

  const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: requestBody.toString(),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || 'SMS could not be sent');
  return { messageId: data.sid || '' };
}

module.exports = { sendOrderSms };
