"use client";

import { useEffect, useState } from "react";
import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { MessageSquare, Calendar, Star, Send, RotateCcw, ShieldCheck, Check } from "lucide-react";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

interface Review {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  userName: string;
  userEmail: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  isApproved: boolean;
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  vendorReply: {
    message: string;
    repliedAt: string;
  } | null;
  createdAt: string;
}

export default function VendorReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/vendor/reviews");
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSendReply = async (reviewId: string) => {
    const text = replyText[reviewId]?.trim();
    if (!text) {
      toast.error("Please enter a reply message.");
      return;
    }

    setSubmittingId(reviewId);
    try {
      const res = await fetch("/api/vendor/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, message: text }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit reply");
      }

      toast.success("Reply submitted successfully!");
      setReplyText((prev) => ({ ...prev, [reviewId]: "" }));
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit reply");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <DashboardPage eyebrow="Customer Relations" title="Product Reviews">
      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
          <p className="text-sm font-semibold">No reviews received yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Customer reviews on your products will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-xs hover:shadow-sm transition duration-200"
            >
              {/* Product and Reviewer Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-border/40 pb-4">
                <div className="flex gap-3.5 items-center">
                  <img
                    src={r.productImage || "/assets/placeholder-product.jpg"}
                    alt={r.productName}
                    className="h-12 w-12 object-cover rounded-xl border border-border"
                  />
                  <div className="min-w-0">
                    <a
                      href={`/shop/${r.productSlug}`}
                      target="_blank"
                      className="text-xs font-bold text-charcoal hover:underline line-clamp-1"
                    >
                      {r.productName}
                    </a>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        By {r.userName}
                      </span>
                      {r.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                          <ShieldCheck className="h-3 w-3" />
                          Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="flex items-center sm:justify-end gap-0.5 text-amber-500 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 fill-current ${
                          i < r.rating ? "text-amber-500" : "text-neutral-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(r.createdAt)}
                  </span>
                </div>
              </div>

              {/* Review Content */}
              <div className="py-4">
                {r.title && (
                  <h4 className="font-serif text-sm font-bold text-charcoal">{r.title}</h4>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 whitespace-pre-wrap">
                  "{r.comment}"
                </p>

                {r.images && r.images.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {r.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Review attachment"
                        className="h-14 w-14 object-cover rounded-lg border border-border hover:opacity-90 transition cursor-pointer"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Existing Vendor Reply or Form */}
              <div className="mt-2 bg-muted/30 border border-border/50 rounded-xl p-4.5 space-y-3">
                {r.vendorReply ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        Your Reply
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        Replied on {formatDate(r.vendorReply.repliedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal mt-1.5 italic leading-relaxed">
                      "{r.vendorReply.message}"
                    </p>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() =>
                          setReplyText((prev) => ({ ...prev, [r.id]: r.vendorReply!.message }))
                        }
                        className="text-[10px] font-bold text-muted-foreground hover:text-primary transition uppercase tracking-wider cursor-pointer"
                      >
                        Edit Reply
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                      Respond to Customer Review
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Write your response message..."
                        value={replyText[r.id] || ""}
                        onChange={(e) =>
                          setReplyText((prev) => ({ ...prev, [r.id]: e.target.value }))
                        }
                        className="flex-1 bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        onClick={() => handleSendReply(r.id)}
                        disabled={submittingId === r.id || !replyText[r.id]?.trim()}
                        className="bg-charcoal hover:bg-cognac text-cream hover:text-cream text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Send className="h-3 w-3" />
                        {submittingId === r.id ? "Sending..." : "Reply"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit Form (if replying is currently active with text) */}
                {r.vendorReply && replyText[r.id] !== undefined && replyText[r.id] !== "" && (
                  <div className="border-t border-border/40 pt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Edit your response..."
                      value={replyText[r.id]}
                      onChange={(e) =>
                        setReplyText((prev) => ({ ...prev, [r.id]: e.target.value }))
                      }
                      className="flex-1 bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                    <button
                      onClick={() => handleSendReply(r.id)}
                      disabled={submittingId === r.id}
                      className="bg-primary text-primary-foreground hover:bg-primary/95 text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer transition flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Save
                    </button>
                    <button
                      onClick={() => setReplyText((prev) => ({ ...prev, [r.id]: "" }))}
                      className="text-[10px] uppercase font-bold text-muted-foreground hover:text-charcoal px-3 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardPage>
  );
}
