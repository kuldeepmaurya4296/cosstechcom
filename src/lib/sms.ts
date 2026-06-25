/**
 * SMS Gateway Abstraction supporting MSG91, Twilio, and local console logging fallback.
 */

export interface ISmsPayload {
  to: string; // Phone number with country code (e.g., +91XXXXXXXXXX)
  message: string;
  templateId?: string; // Specific template ID for MSG91
}

export async function sendSms(payload: ISmsPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, message, templateId } = payload;
  
  // 1. MSG91 Integration
  if (process.env.MSG91_AUTH_KEY) {
    const authKey = process.env.MSG91_AUTH_KEY;
    const template = templateId || process.env.MSG91_TEMPLATE_ID;
    
    if (!template) {
      return { success: false, error: 'MSG91 templateId is required' };
    }
    
    try {
      // MSG91 API call format
      // Clean phone number (MSG91 expects country code without + for India etc.)
      const cleanPhone = to.replace('+', '');
      
      const response = await fetch('https://api.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'authkey': authKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          flow_id: template,
          sender: process.env.MSG91_SENDER_ID || 'COSTECH',
          mobiles: cleanPhone,
          // Template variables if needed
          var: message, 
        }),
      });
      
      const data = await response.json();
      if (response.ok && data.type === 'success') {
        return { success: true, messageId: data.request_id };
      }
      return { success: false, error: data.message || 'MSG91 API error' };
    } catch (err: any) {
      console.error('MSG91 SMS failed:', err);
      return { success: false, error: err.message || 'MSG91 connection failed' };
    }
  }

  // 2. Twilio Integration
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER || '';
    
    try {
      const auth = Buffer.from(`${sid}:${token}`).toString('base64');
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: from,
          Body: message,
        }),
      });
      
      const data = await response.json();
      if (response.ok && data.sid) {
        return { success: true, messageId: data.sid };
      }
      return { success: false, error: data.message || 'Twilio API error' };
    } catch (err: any) {
      console.error('Twilio SMS failed:', err);
      return { success: false, error: err.message || 'Twilio connection failed' };
    }
  }

  // 3. Fallback: Local Console Log
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n--- 📱 [SMS GATEWAY FALLBACK] ---');
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    if (templateId) console.log(`Template ID: ${templateId}`);
    console.log('---------------------------------\n');
  }
  
  return { success: true, messageId: `mock-msg-${Date.now()}` };
}
