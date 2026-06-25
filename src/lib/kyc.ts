/**
 * KYC Verification Gateway Abstraction supporting Cashfree API and local mock fallback.
 */

export interface IGstinVerifyResult {
  success: boolean;
  legalName?: string;
  tradeName?: string;
  status?: string;
  address?: string;
  error?: string;
}

export interface IPanVerifyResult {
  success: boolean;
  fullName?: string;
  status?: string;
  error?: string;
}

export interface IBankVerifyResult {
  success: boolean;
  accountName?: string;
  referenceId?: string;
  error?: string;
}

/**
 * Verify GSTIN number using Cashfree Verification Suite.
 */
export async function verifyGstin(gstin: string): Promise<IGstinVerifyResult> {
  const cleanGstin = gstin.trim().toUpperCase();
  
  if (process.env.CASHFREE_CLIENT_ID && process.env.CASHFREE_CLIENT_SECRET) {
    try {
      const response = await fetch('https://api.cashfree.com/verification/gstin', {
        method: 'POST',
        headers: {
          'x-client-id': process.env.CASHFREE_CLIENT_ID,
          'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gstin: cleanGstin }),
      });

      const data = await response.json();
      if (response.ok && data.status === 'SUCCESS') {
        return {
          success: true,
          legalName: data.registered_name || data.legal_name,
          tradeName: data.trade_name || data.registered_name,
          status: data.taxpayer_type,
          address: data.principal_place_address,
        };
      }
      return { success: false, error: data.message || 'GSTIN verification failed' };
    } catch (err: any) {
      console.error('Cashfree GSTIN verification failed:', err);
      return { success: false, error: err.message || 'Cashfree connection failed' };
    }
  }

  // Fallback mock
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[KYC MOCK] Verifying GSTIN: ${cleanGstin}`);
  }
  
  // Basic format check: Indian GSTIN is 15 characters
  if (cleanGstin.length !== 15) {
    return { success: false, error: 'GSTIN must be exactly 15 characters long' };
  }

  return {
    success: true,
    legalName: 'CosstechCom Mock Merchant Ltd',
    tradeName: 'Mock Merchant Store',
    status: 'Active',
    address: '101 Mock Plaza, Jaipur, Rajasthan, 302001',
  };
}

/**
 * Verify PAN number using Cashfree Verification Suite.
 */
export async function verifyPan(pan: string, fullName: string): Promise<IPanVerifyResult> {
  const cleanPan = pan.trim().toUpperCase();
  
  if (process.env.CASHFREE_CLIENT_ID && process.env.CASHFREE_CLIENT_SECRET) {
    try {
      const response = await fetch('https://api.cashfree.com/verification/pan', {
        method: 'POST',
        headers: {
          'x-client-id': process.env.CASHFREE_CLIENT_ID,
          'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pan: cleanPan, name: fullName }),
      });

      const data = await response.json();
      if (response.ok && data.status === 'SUCCESS') {
        return {
          success: true,
          fullName: data.registered_name || data.name,
          status: data.pan_status,
        };
      }
      return { success: false, error: data.message || 'PAN verification failed' };
    } catch (err: any) {
      console.error('Cashfree PAN verification failed:', err);
      return { success: false, error: err.message || 'Cashfree connection failed' };
    }
  }

  // Fallback mock
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[KYC MOCK] Verifying PAN: ${cleanPan} for ${fullName}`);
  }

  if (cleanPan.length !== 10) {
    return { success: false, error: 'PAN must be exactly 10 characters long' };
  }

  return {
    success: true,
    fullName: fullName.toUpperCase(),
    status: 'VALID',
  };
}

/**
 * Verify bank account using penny drop (₹1 deposit) via Cashfree Verification Suite.
 */
export async function verifyBankAccount(
  accountNumber: string,
  ifscCode: string,
  phone: string,
  name: string
): Promise<IBankVerifyResult> {
  const cleanAccount = accountNumber.trim();
  const cleanIfsc = ifscCode.trim().toUpperCase();

  if (process.env.CASHFREE_CLIENT_ID && process.env.CASHFREE_CLIENT_SECRET) {
    try {
      const response = await fetch('https://api.cashfree.com/verification/bank-penny-drop', {
        method: 'POST',
        headers: {
          'x-client-id': process.env.CASHFREE_CLIENT_ID,
          'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          name: name,
          bank_account: cleanAccount,
          ifsc: cleanIfsc,
        }),
      });

      const data = await response.json();
      if (response.ok && data.status === 'SUCCESS') {
        return {
          success: true,
          accountName: data.name_at_bank || data.registered_name,
          referenceId: data.reference_id,
        };
      }
      return { success: false, error: data.message || 'Bank account penny-drop failed' };
    } catch (err: any) {
      console.error('Cashfree Bank verification failed:', err);
      return { success: false, error: err.message || 'Cashfree connection failed' };
    }
  }

  // Fallback mock
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[KYC MOCK] Penny Drop on Account: ${cleanAccount}, IFSC: ${cleanIfsc}`);
  }

  if (cleanAccount.length < 8 || cleanAccount.length > 20) {
    return { success: false, error: 'Invalid bank account number length' };
  }

  if (cleanIfsc.length !== 11) {
    return { success: false, error: 'Invalid IFSC code length' };
  }

  return {
    success: true,
    accountName: name.toUpperCase(),
    referenceId: `mock-ref-${Date.now()}`,
  };
}
