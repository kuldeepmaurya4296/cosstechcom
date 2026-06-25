import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import VendorProfile from '@/lib/models/VendorProfile';
import KycDocument from '@/lib/models/KycDocument';
import Notification from '@/lib/models/Notification';
import mongoose from 'mongoose';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { id: vendorId } = await params;
    const body = await request.json();
    const { docType, action, reason } = body;

    if (!docType || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters. docType and action required.' }, { status: 400 });
    }

    await connectToDatabase();

    // Find the specific KYC document
    const kycDoc = await KycDocument.findOne({ vendorId, docType });
    if (!kycDoc) {
      return NextResponse.json({ error: `No KYC document of type ${docType} found for this vendor` }, { status: 404 });
    }

    // Update document status
    kycDoc.verificationStatus = action === 'approve' ? 'verified' : 'rejected';
    kycDoc.rejectionReason = action === 'reject' ? reason : undefined;
    kycDoc.verifiedAt = new Date();
    kycDoc.verifiedBy = new mongoose.Types.ObjectId(session.user.id) as any;
    await kycDoc.save();

    // Find and update VendorProfile
    const vendorProfile = await VendorProfile.findOne({ userId: vendorId });
    if (!vendorProfile) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    if (docType === 'gstin') {
      vendorProfile.gstinVerified = action === 'approve';
    } else if (docType === 'pan') {
      vendorProfile.panVerified = action === 'approve';
    } else if (docType === 'bank_proof') {
      vendorProfile.bankVerified = action === 'approve';
    }

    // Re-evaluate overall KYC status
    // Fetch all documents for this vendor to verify overall state
    const docs = await KycDocument.find({ vendorId });
    const allDocsVerified = docs.length >= 3 && docs.every(d => d.verificationStatus === 'verified');
    const anyDocRejected = docs.some(d => d.verificationStatus === 'rejected');

    if (allDocsVerified) {
      vendorProfile.kycStatus = 'verified';
      vendorProfile.verificationStatus = 'approved';
    } else if (anyDocRejected) {
      vendorProfile.kycStatus = 'rejected';
      vendorProfile.verificationStatus = 'rejected';
    } else {
      vendorProfile.kycStatus = 'submitted';
      vendorProfile.verificationStatus = 'pending';
    }

    await vendorProfile.save();

    // Notify the vendor
    await Notification.create({
      userId: vendorId as any,
      type: 'kyc',
      title: `KYC Document ${docType.toUpperCase()} ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      message: action === 'approve' 
        ? `Your submitted ${docType.toUpperCase()} document has been verified.` 
        : `Your submitted ${docType.toUpperCase()} document was rejected. Reason: ${reason || 'Invalid details'}. Please upload again.`,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      message: `KYC document ${docType.toUpperCase()} has been ${action === 'approve' ? 'approved' : 'rejected'}`,
      profile: vendorProfile,
    });
  } catch (err: any) {
    console.error('Admin KYC review error:', err);
    return NextResponse.json({ error: 'Internal server error during KYC document review' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
