/**
 * Security utility helpers for CAPTCHA verification, input sanitization, and NoSQL injection guards.
 */

/**
 * Verify Cloudflare Turnstile or Google reCAPTCHA v3 tokens.
 * Falls back to true in development mode if no keys are configured.
 */
export async function verifyCaptcha(token?: string, clientIp?: string): Promise<boolean> {
  const secretKey = process.env.CAPTCHA_SECRET_KEY;

  if (!secretKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ CAPTCHA_SECRET_KEY is not configured. Automatically passing CAPTCHA check in dev.');
      return true;
    }
    // In production, if it's not configured, return true or warn, but let's default to false to be secure
    return false;
  }

  if (!token) return false;

  try {
    // Cloudflare Turnstile endpoint
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
        remoteip: clientIp,
      }),
    });

    const data = await response.json();
    return !!data.success;
  } catch (err) {
    console.error('CAPTCHA verification failed:', err);
    return false;
  }
}

/**
 * Strips HTML tags from a string to prevent XSS attacks.
 */
export function sanitizeString(val: string): string {
  if (typeof val !== 'string') return val;
  // Replace HTML tags with empty string
  return val.replace(/<[^>]*>/g, '').trim();
}

/**
 * Recursively sanitizes objects to remove key names starting with '$' or containing '.'
 * to prevent MongoDB query/NoSQL injection.
 */
export function sanitizeMongoInput<T = any>(input: T): T {
  if (input === null || input === undefined) return input;

  if (Array.isArray(input)) {
    return input.map(item => sanitizeMongoInput(item)) as unknown as T;
  }

  if (typeof input === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const key of Object.keys(input as Record<string, any>)) {
      // Strip out keys starting with $ or containing dots which are Mongoose operators/queries
      if (key.startsWith('$') || key.includes('.')) {
        console.warn(`🚨 NoSQL injection attempt blocked. Removed key: "${key}"`);
        continue;
      }
      sanitizedObj[key] = sanitizeMongoInput((input as Record<string, any>)[key]);
    }
    return sanitizedObj as unknown as T;
  }

  if (typeof input === 'string') {
    return sanitizeString(input) as unknown as T;
  }

  return input;
}
