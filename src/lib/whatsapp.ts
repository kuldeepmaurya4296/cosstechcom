/**
 * WhatsApp Business API Gateway Abstraction supporting Interakt, Gupshup, and console fallback.
 */

export interface IWhatsappPayload {
  to: string; // Phone number with country code (e.g., +91XXXXXXXXXX)
  templateName: string;
  bodyValues: string[];
}

export async function sendWhatsapp(payload: IWhatsappPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, templateName, bodyValues } = payload;

  // 1. Interakt Integration
  if (process.env.INTERAKT_API_KEY) {
    try {
      // Split country code and phone number (Interakt expects countryCode and phoneNumber separate, or we can use fullPhoneNumber)
      const response = await fetch('https://api.interakt.ai/v1/public/message/', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${process.env.INTERAKT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullPhoneNumber: to,
          type: 'Template',
          template: {
            name: templateName,
            languageCode: 'en',
            bodyValues: bodyValues,
          },
        }),
      });

      const data = await response.json();
      if (response.ok && data.result) {
        return { success: true, messageId: data.id };
      }
      return { success: false, error: data.message || 'Interakt API error' };
    } catch (err: any) {
      console.error('Interakt WhatsApp failed:', err);
      return { success: false, error: err.message || 'Interakt connection failed' };
    }
  }

  // 2. Gupshup Integration
  if (process.env.GUPSHUP_API_KEY && process.env.GUPSHUP_APP_NAME) {
    try {
      const cleanPhone = to.replace('+', ''); // Gupshup expects numbers without +
      
      const response = await fetch('https://api.gupshup.io/sm/api/v1/template/msg', {
        method: 'POST',
        headers: {
          'apikey': process.env.GUPSHUP_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          channel: 'whatsapp',
          source: process.env.GUPSHUP_SOURCE_NUMBER || '',
          destination: cleanPhone,
          'src.name': process.env.GUPSHUP_APP_NAME,
          template: JSON.stringify({
            id: templateName, // Gupshup template ID
            params: bodyValues,
          }),
        }),
      });

      const data = await response.json();
      if (response.ok && data.status === 'submitted') {
        return { success: true, messageId: data.messageId };
      }
      return { success: false, error: data.message || 'Gupshup API error' };
    } catch (err: any) {
      console.error('Gupshup WhatsApp failed:', err);
      return { success: false, error: err.message || 'Gupshup connection failed' };
    }
  }

  // 3. Fallback: Local Console Log
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n--- 💬 [WHATSAPP GATEWAY FALLBACK] ---');
    console.log(`To: ${to}`);
    console.log(`Template: ${templateName}`);
    console.log(`Values: [${bodyValues.join(', ')}]`);
    console.log('--------------------------------------\n');
  }

  return { success: true, messageId: `mock-wa-${Date.now()}` };
}
