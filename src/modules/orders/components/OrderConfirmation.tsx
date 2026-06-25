import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function OrderConfirmation({ orderId }: { orderId?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center max-w-lg"
    >
      <CheckCircle2 className="h-16 w-16 mx-auto text-cognac" />
      <h1 className="font-serif text-4xl font-bold mt-4">Order placed.</h1>
      <p className="text-muted-foreground mt-2">
        Order #{orderId || "COSS-10428"} — confirmation sent to your email.
      </p>
      <p className="text-sm text-muted-foreground mt-1">Estimated delivery: 5–7 business days.</p>
      <div className="mt-8 flex gap-3 justify-center">
        <Link
          href="/account/orders"
          className="bg-primary text-primary-foreground rounded-full px-6 py-3 text-sm font-semibold hover:opacity-95 transition"
        >
          Track order
        </Link>
        <Link
          href="/shop"
          className="border border-border rounded-full px-6 py-3 text-sm font-semibold hover:bg-muted transition"
        >
          Continue
        </Link>
      </div>
    </motion.div>
  );
}
