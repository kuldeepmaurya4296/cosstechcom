"use client";

import React, { useState, useEffect } from "react";
import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import {
  Star,
  Check,
  X,
  Trash2,
  Search,
  Loader2,
  Eye,
  Edit2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatINR } from "@/lib/format";

interface AdminReview {
  _id: string;
  productId: {
    _id: string;
    name: string;
    slug: string;
    images: { url: string }[];
  } | null;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  } | null;
  rating: number;
  title?: string;
  comment?: string;
  images: string[];
  isApproved: boolean;
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");

  // Dialog/Modal states
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Edit form states
  const [editRating, setEditRating] = useState(5);
  const [editHoverRating, setEditHoverRating] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editComment, setEditComment] = useState("");

  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reviews?approvedOnly=false");
      if (!res.ok) {
        throw new Error("Failed to fetch reviews");
      }
      const data = await res.json();
      setReviews(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load reviews list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const openViewDialog = (review: AdminReview) => {
    setSelectedReview(review);
    setIsViewOpen(true);
  };

  const openEditDialog = (review: AdminReview) => {
    setSelectedReview(review);
    setEditRating(review.rating);
    setEditTitle(review.title || "");
    setEditComment(review.comment || "");
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    setActioningId(selectedReview._id);
    try {
      const res = await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: selectedReview._id,
          rating: editRating,
          title: editTitle.trim(),
          comment: editComment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update review");
      }

      toast.success("Review updated successfully!");
      setReviews((prev) =>
        prev.map((r) =>
          r._id === selectedReview._id
            ? { ...r, rating: editRating, title: editTitle.trim(), comment: editComment.trim() }
            : r,
        ),
      );
      setIsEditOpen(false);
      setSelectedReview(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to edit review.");
    } finally {
      setActioningId(null);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;

    setActioningId(reviewId);
    try {
      const res = await fetch(`/api/reviews?id=${reviewId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete review");
      }

      toast.success("Review deleted permanently.");
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      if (selectedReview?._id === reviewId) {
        setIsViewOpen(false);
        setSelectedReview(null);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete review.");
    } finally {
      setActioningId(null);
    }
  };

  // Filtered reviews calculations
  const filteredReviews = reviews.filter((r) => {
    // Rating Filter
    if (ratingFilter !== "all" && r.rating !== ratingFilter) return false;

    // Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const userName = r.userId?.name?.toLowerCase() || "";
      const userEmail = r.userId?.email?.toLowerCase() || "";
      const productName = r.productId?.name?.toLowerCase() || "";
      const title = r.title?.toLowerCase() || "";
      const comment = r.comment?.toLowerCase() || "";

      return (
        userName.includes(q) ||
        userEmail.includes(q) ||
        productName.includes(q) ||
        title.includes(q) ||
        comment.includes(q)
      );
    }

    return true;
  });

  const renderStars = (count: number, interactive = false) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => {
          const starValue = i + 1;
          const isFilled = interactive
            ? starValue <= (editHoverRating ?? editRating)
            : starValue <= count;

          return (
            <Star
              key={i}
              onMouseEnter={() => interactive && setEditHoverRating(starValue)}
              onMouseLeave={() => interactive && setEditHoverRating(null)}
              onClick={() => interactive && setEditRating(starValue)}
              className={`h-4.5 w-4.5 ${
                interactive ? "cursor-pointer hover:scale-115 transition-transform" : ""
              } ${isFilled ? "fill-brass text-brass" : "text-muted/40 hover:text-brass/75"}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <DashboardPage eyebrow="Moderation" title="Product Reviews">
      {/* Search and Filters Bar */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reviews by user, product, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>

        {/* Rating Filter */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-muted-foreground font-semibold">Filter by Rating:</span>
          <select
            value={ratingFilter}
            onChange={(e) =>
              setRatingFilter(e.target.value === "all" ? "all" : Number(e.target.value))
            }
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold outline-none cursor-pointer"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-card border border-border rounded-2xl">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground text-sm font-medium">Loading reviews catalog...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl p-6">
          <ShieldAlert className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3.5" />
          <h3 className="font-serif text-lg font-bold text-charcoal mb-1">No reviews found</h3>
          <p className="text-muted-foreground text-sm">
            {reviews.length === 0
              ? "Customers haven't submitted any reviews yet."
              : "Try adjusting your filters or search query to find reviews."}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/80 text-muted-foreground uppercase font-bold border-b border-border">
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Reviewer</th>
                  <th className="px-5 py-3.5">Rating</th>
                  <th className="px-5 py-3.5">Review Title & Details</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-center">Verified</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredReviews.map((r) => (
                  <tr
                    key={r._id}
                    className="hover:bg-muted/20 transition-colors text-muted-foreground"
                  >
                    {/* Product */}
                    <td className="px-5 py-4 min-w-[200px]">
                      {r.productId ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={r.productId.images?.[0]?.url || "/assets/product-placeholder.jpg"}
                            alt={r.productId.name}
                            className="h-10 w-10 object-cover rounded-lg border border-border bg-muted shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-charcoal truncate max-w-[150px]">
                              {r.productId.name}
                            </p>
                            <Link
                              href={`/shop/${r.productId.slug}`}
                              target="_blank"
                              className="text-[10px] text-primary font-bold hover:underline"
                            >
                              View Page
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <span className="italic text-muted-foreground/60">Removed Product</span>
                      )}
                    </td>

                    {/* Reviewer */}
                    <td className="px-5 py-4 min-w-[150px]">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-border/10 overflow-hidden">
                          {r.userId?.avatar ? (
                            <img
                              src={r.userId.avatar}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{r.userId?.name?.charAt(0) || "A"}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-charcoal truncate max-w-[120px]">
                            {r.userId?.name || "Anonymous"}
                          </p>
                          <p className="text-[10px] text-muted-foreground/75 truncate max-w-[120px]">
                            {r.userId?.email || "No email"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {renderStars(r.rating)}
                        <span className="font-bold text-charcoal font-serif">({r.rating})</span>
                      </div>
                    </td>

                    {/* Title & Body preview */}
                    <td className="px-5 py-4 max-w-xs">
                      <div className="min-w-0">
                        {r.title && (
                          <p className="font-semibold text-charcoal truncate">{r.title}</p>
                        )}
                        <p className="text-xs text-muted-foreground/80 truncate">
                          {r.comment || "(No text review)"}
                        </p>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Verified */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      {r.isVerifiedPurchase ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full border border-border/40">
                          No
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openViewDialog(r)}
                          className="p-1.5 hover:bg-muted text-charcoal rounded cursor-pointer transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditDialog(r)}
                          className="p-1.5 hover:bg-muted text-primary rounded cursor-pointer transition-colors"
                          title="Edit Review"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(r._id)}
                          disabled={actioningId === r._id}
                          className="p-1.5 hover:bg-destructive/10 text-destructive rounded cursor-pointer transition-colors disabled:opacity-50"
                          title="Delete Review"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODAL DIALOG */}
      <AdminModal
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setSelectedReview(null);
        }}
        title="Review Details"
      >
        {selectedReview && (
          <div className="space-y-5">
            {/* Reviewer & Product info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/40">
              <div>
                <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">
                  Reviewer Info
                </h4>
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm uppercase overflow-hidden shrink-0 border border-border/10">
                    {selectedReview.userId?.avatar ? (
                      <img
                        src={selectedReview.userId.avatar}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{selectedReview.userId?.name?.charAt(0) || "A"}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-charcoal truncate">
                      {selectedReview.userId?.name || "Anonymous"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {selectedReview.userId?.email || "No email ID"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">
                  Product Info
                </h4>
                {selectedReview.productId ? (
                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        selectedReview.productId.images?.[0]?.url ||
                        "/assets/product-placeholder.jpg"
                      }
                      alt={selectedReview.productId.name}
                      className="h-9 w-9 object-cover rounded-lg border border-border bg-card shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-charcoal truncate">
                        {selectedReview.productId.name}
                      </p>
                      <Link
                        href={`/shop/${selectedReview.productId.slug}`}
                        target="_blank"
                        className="text-[10px] text-primary font-bold hover:underline"
                      >
                        Visit Details Page
                      </Link>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs italic text-muted-foreground">Product removed</span>
                )}
              </div>
            </div>

            {/* Rating & Date details */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-charcoal">Rating:</span>
                {renderStars(selectedReview.rating)}
                <span className="text-xs font-bold text-charcoal">({selectedReview.rating}.0)</span>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-charcoal">Posted:</span>{" "}
                {new Date(selectedReview.createdAt).toLocaleString("en-IN")}
              </div>
            </div>

            {/* Title & Comment Content */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Review Content
              </span>
              {selectedReview.title && (
                <h3 className="font-bold text-charcoal text-sm">{selectedReview.title}</h3>
              )}
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/20 p-4 rounded-xl border border-border/30">
                {selectedReview.comment || (
                  <span className="italic text-muted-foreground/60">
                    No written details provided.
                  </span>
                )}
              </p>
            </div>

            {/* Images Gallery */}
            {selectedReview.images && selectedReview.images.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Attached Photos ({selectedReview.images.length})
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {selectedReview.images.map((url, idx) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-20 w-20 rounded-xl overflow-hidden border border-border bg-muted hover:opacity-90 transition shadow-sm"
                    >
                      <img
                        src={url}
                        alt="Attached review photo"
                        className="h-full w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setIsViewOpen(false);
                  openEditDialog(selectedReview);
                }}
                className="px-5 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-full transition cursor-pointer"
              >
                Edit Review
              </button>
              <button
                onClick={() => {
                  if (confirm("Are you sure?")) {
                    handleDeleteReview(selectedReview._id);
                  }
                }}
                className="px-5 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold rounded-full transition cursor-pointer"
              >
                Delete Review
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* EDIT MODAL DIALOG */}
      <AdminModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedReview(null);
        }}
        title="Edit Review"
      >
        {selectedReview && (
          <form onSubmit={handleEditSubmit} className="space-y-5">
            {/* User & Product Header summary */}
            <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-3">
              <p>
                Editing review for{" "}
                <span className="font-semibold text-charcoal">
                  {selectedReview.productId?.name || "Removed Product"}
                </span>
              </p>
              <p>
                By{" "}
                <span className="font-semibold text-charcoal">
                  {selectedReview.userId?.name || "Anonymous"}
                </span>
              </p>
            </div>

            {/* Edit Rating */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Rating Stars <span className="text-destructive">*</span>
              </label>
              {renderStars(editRating, true)}
            </div>

            {/* Edit Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Review Title (optional)
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Review title heading..."
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>

            {/* Edit Comment */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Review Details (optional)
              </label>
              <textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                placeholder="Review comment details..."
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-none"
              />
            </div>

            {/* Submit Actions */}
            <div className="flex justify-end gap-3 pt-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedReview(null);
                }}
                className="px-5 py-2.5 border border-border hover:bg-muted text-xs font-semibold rounded-full transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actioningId === selectedReview._id}
                className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-full transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {actioningId === selectedReview._id ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        )}
      </AdminModal>
    </DashboardPage>
  );
}

/* Local modal box utility helper */
function AdminModal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-charcoal/50 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg max-h-[85vh] bg-card border border-border rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <h3 className="font-serif text-base font-bold text-charcoal">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-full transition cursor-pointer border-0"
          >
            <X className="h-4.5 w-4.5 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
