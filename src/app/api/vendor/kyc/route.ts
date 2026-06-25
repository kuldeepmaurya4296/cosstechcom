import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import VendorProfile from '@/lib/models/VendorProfile';
import KycDocument from '@/lib/models/KycDocument';
import { verifyGstin, verifyPan, verifyBankAccount } from '@/lib/kyc';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized. Only vendors can submit KYC.' }, { status: 401 });
    }

    const body = await request.json();
    const { gstin, pan, bankAccount, documents } = body;

    if (!gstin || !pan || !bankAccount || !documents) {
      return NextResponse.json({ error: 'Missing required KYC details or document files' }, { status: 400 });
    }

    const { accountNumber, ifscCode, holderName, bankName } = bankAccount;
    const { gstinUrl, panUrl, bankProofUrl } = documents;

    if (!accountNumber || !ifscCode || !holderName || !bankName || !gstinUrl || !panUrl || !bankProofUrl) {
      return NextResponse.json({ error: 'Missing bank details or document file URLs' }, { status: 400 });
    }

    await connectToDatabase();

    const vendorProfile = await VendorProfile.findOne({ userId: session.user.id });
    if (!vendorProfile) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    // Step 1: Run automated API verifications
    const gstinResult = await verifyGstin(gstin);
    const panResult = await verifyPan(pan, holderName);
    const bankResult = await verifyBankAccount(accountNumber, ifscCode, session.user.phone || '9999999999', holderName);

    // Step 2: Delete old KYC documents for this vendor
    await KycDocument.deleteMany({ vendorId: session.user.id });

    // Step 3: Create KycDocument records
    const gstinDoc = await KycDocument.create({
      vendorId: session.user.id,
      docType: 'gstin',
      docNumber: gstin.toUpperCase(),
      fileUrl: gstinUrl,
      verificationStatus: gstinResult.success ? 'verified' : 'rejected',
      rejectionReason: gstinResult.success ? undefined : gstinResult.error,
      verifiedAt: gstinResult.success ? new Date() : undefined,
    });

    const panDoc = await KycDocument.create({
      vendorId: session.user.id,
      docType: 'pan',
      docNumber: pan.toUpperCase(),
      fileUrl: panUrl,
      verificationStatus: panResult.success ? 'verified' : 'rejected',
      rejectionReason: panResult.success ? undefined : panResult.error,
      verifiedAt: panResult.success ? new Date() : undefined,
    });

    const bankDoc = await KycDocument.create({
      vendorId: session.user.id,
      docType: 'bank_proof',
      docNumber: accountNumber,
      fileUrl: bankProofUrl,
      verificationStatus: bankResult.success ? 'verified' : 'rejected',
      rejectionReason: bankResult.success ? undefined : bankResult.error,
      verifiedAt: bankResult.success ? new Date() : undefined,
    });

    // Step 4: Update VendorProfile with verified flags and overall KYC status
    vendorProfile.gstinVerified = gstinResult.success;
    vendorProfile.panVerified = panResult.success;
    vendorProfile.bankVerified = bankResult.success;
    
    // Update basic details if verified
    if (gstinResult.success) {
      vendorProfile.gstNumber = gstin.toUpperCase();
    }
    if (panResult.success) {
      vendorProfile.panNumber = pan.toUpperCase();
    }
    vendorProfile.bankAccount = {
      holderName,
      bankName,
      accountNumber,
      ifscCode,
    };

    const allVerified = gstinResult.success && panResult.success && bankResult.success;
    vendorProfile.kycStatus = allVerified ? 'verified' : 'rejected';
    
    // Also sync the vendor profile approval status if KYC fails or passes
    if (!allVerified) {
      vendorProfile.verificationStatus = 'rejected';
    } else {
      vendorProfile.verificationStatus = 'approved';
    }

    await vendorProfile.save();

    return NextResponse.json({
      success: true,
      message: allVerified ? 'KYC automatically verified and approved!' : 'KYC verification failed. Please review errors.',
      status: {
        gstin: gstinResult.success ? 'VERIFIED' : 'FAILED',
        pan: panResult.success ? 'VERIFIED' : 'FAILED',
        bank: bankResult.success ? 'VERIFIED' : 'FAILED',
      },
      profile: vendorProfile,
    });
  } catch (err: any) {
    console.error('KYC submission error:', err);
    return NextResponse.json({ error: 'Internal server error during KYC submission' }, { status: 500 });
  }
}
