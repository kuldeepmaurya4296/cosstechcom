import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function EmptyCartState() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center max-w-md">
      <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
        <ShoppingBag className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="font-serif text-3xl font-bold mt-4">Your bag is empty</h1>
      <p className="text-muted-foreground mt-2">Let's fix that.</p>
      <Link
        href="/shop"
        className="mt-6 inline-block bg-primary text-primary-foreground rounded-full px-6 py-3 font-semibold text-sm hover:opacity-95 transition cursor-pointer"
      >
        Browse boots
      </Link>
    </div>
  );
}
