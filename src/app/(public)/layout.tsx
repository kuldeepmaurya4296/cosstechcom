import { Navbar } from "@/components/public/Navbar";
import { BottomNav } from "@/components/public/BottomNav";
import { Footer } from "@/components/public/Footer";
import { WhatsAppWidget } from "@/components/public/WhatsAppWidget";
import { FlashSaleBanner } from "@/components/public/FlashSaleBanner";
import { Suspense } from "react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <FlashSaleBanner />
      <Suspense fallback={<div className="h-16" />}>
        <Navbar />
      </Suspense>
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <WhatsAppWidget />
      <BottomNav />
    </div>
  );
}
