import nodemailer from "nodemailer";
import { connectToDatabase } from "@/lib/db";
import Settings from "@/lib/models/Settings";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // True for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  let storeName = "Raja Boot House";
  try {
    await connectToDatabase();
    const generalDoc = await Settings.findOne({ key: "general" }).lean();
    if (generalDoc && generalDoc.value && (generalDoc.value as any).storeName) {
      storeName = (generalDoc.value as any).storeName;
    }
  } catch (err) {
    console.error("Failed to load settings in mail utility, using fallback storeName:", err);
  }

  const mailOptions = {
    from: `"${storeName} Support" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  };

  console.log(`Sending email to ${to} using SMTP...`);
  const info = await transporter.sendMail(mailOptions);
  console.log("Email sent successfully: %s", info.messageId);
  return info;
}
