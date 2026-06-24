import { connectToDatabase } from "@/lib/db";
import Settings from "@/lib/models/Settings";
import Link from "next/link";
import { Info, ArrowLeft } from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Return & Refund Policy — Raja Boot House",
  description:
    "Read about our 30-day return policy, conditions for refunds, size exchanges, and banking credits.",
  alternates: {
    canonical: "/refund-policy",
  },
  openGraph: {
    title: "Return & Refund Policy — Raja Boot House",
    description:
      "Read about our 30-day return policy, conditions for refunds, size exchanges, and banking credits.",
    type: "website",
  },
};

async function getPolicyContent() {
  await connectToDatabase();
  const setting = await Settings.findOne({ key: "refundPolicy" }).lean();
  return setting?.value || `<p>No policy content available.</p>`;
}

export default async function RefundPolicyPage() {
  const content = await getPolicyContent();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 max-w-[850px]">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
          <Info className="h-48 w-48 text-primary" />
        </div>

        <article
          className="prose prose-stone dark:prose-invert max-w-none 
          prose-headings:font-serif prose-headings:font-bold prose-headings:text-charcoal dark:prose-headings:text-cream/90
          prose-h2:text-2xl prose-h2:border-b prose-h2:border-border/60 prose-h2:pb-2 prose-h2:mt-8
          prose-h3:text-lg prose-h3:mt-6
          prose-p:text-sm prose-p:leading-relaxed prose-p:text-muted-foreground
          prose-ul:text-sm prose-ul:text-muted-foreground prose-ul:list-disc prose-ul:pl-6
          prose-ol:text-sm prose-ol:text-muted-foreground prose-ol:list-decimal prose-ol:pl-6
          prose-strong:text-charcoal dark:prose-strong:text-cream
          prose-a:text-primary prose-a:underline hover:prose-a:text-cognac
        "
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}
