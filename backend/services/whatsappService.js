const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v22.0';

function toWhatsAppNumber(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';

  // Indian numbers are the default for this store. Set WHATSAPP_DEFAULT_COUNTRY_CODE
  // if your customers use another country code.
  const countryCode = String(process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '91').replace(/\D/g, '');
  return digits.length === 10 ? `${countryCode}${digits}` : digits;
}

function isConfigured() {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_ORDER_TEMPLATE
  );
}

async function sendOrderConfirmation(order) {
  if (!isConfigured()) {
    return { skipped: true, reason: 'WhatsApp is not configured' };
  }

  const recipient = toWhatsAppNumber(order.shippingAddress?.phone);
  if (!recipient) {
    throw new Error('The order has no valid WhatsApp phone number');
  }

  const customerName = order.shippingAddress.fullName || 'Customer';
  const orderNumber = order._id.toString().slice(-8).toUpperCase();
  const total = `INR ${Number(order.totalPrice).toLocaleString('en-IN')}`;
  const response = await fetch(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'template',
        template: {
          name: process.env.WHATSAPP_ORDER_TEMPLATE,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US' },
          components: [{
            type: 'body',
            parameters: [
              { type: 'text', text: customerName },
              { type: 'text', text: orderNumber },
              { type: 'text', text: total },
            ],
          }],
        },
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'WhatsApp message could not be sent');
  }

  return { messageId: data?.messages?.[0]?.id || '' };
}

module.exports = { sendOrderConfirmation };
