"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Star,
  MessageSquarePlus,
  Check,
  Trash2,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface ProductReview {
  id: string;
  productId: string;
  userName: string;
  userId: string;
  userAvatar?: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  createdAt: string;
  verified: boolean;
  reviewNumber?: number;
  helpfulVotes?: number;
}

interface ReviewsSectionProps {
  reviews: ProductReview[];
  productId: string;
}

export function ReviewsSection({ reviews, productId }: ReviewsSectionProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Local state for reviews list to allow immediate deletion updates
  const [localReviews, setLocalReviews] = useState<ProductReview[]>(reviews);

  // Find user's oldest review for this product
  const userReviews = session?.user?.id
    ? localReviews.filter((r) => r.userId === session.user.id)
    : [];

  const oldestUserReview =
    userReviews.length > 0
      ? [...userReviews].sort((a, b) => {
          if (a.reviewNumber !== undefined && b.reviewNumber !== undefined) {
            return a.reviewNumber - b.reviewNumber;
          }
          return a.id.localeCompare(b.id);
        })[0]
      : null;

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  // Sync oldest review's rating to the form rating state when form opens
  useEffect(() => {
    if (showForm) {
      setRating(oldestUserReview ? oldestUserReview.rating : 5);
    }
  }, [showForm, oldestUserReview]);

  // Image upload states
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Filtering & Sorting states
  const [filterRating, setFilterRating] = useState<number | null>(null); // null means All Ratings
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "helpful" | "high" | "low">("recent");
  const [votedReviews, setVotedReviews] = useState<string[]>([]);

  // Load helpful votes from localStorage on client-side mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("rbh-helpful-votes");
        if (stored) {
          setVotedReviews(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Failed to load helpful votes:", err);
      }
    }
  }, []);

  // Lightbox modal states
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);

  // Sync props to local state if initial reviews prop changes
  useEffect(() => {
    setLocalReviews(reviews);
  }, [reviews]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 images per review.");
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" is too large. Max size is 5MB.`);
        continue;
      }

      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" is not an image file.`);
        continue;
      }

      const toastId = toast.loading(`Uploading "${file.name}"...`);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Upload failed");
        }

        uploadedUrls.push(data.url);
        toast.success(`"${file.name}" uploaded successfully!`, { id: toastId });
      } catch (err: any) {
        console.error("Upload error:", err);
        toast.error(err.message || `Failed to upload "${file.name}"`, { id: toastId });
      }
    }

    setUploadedImages((prev) => [...prev, ...uploadedUrls]);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveUploadedImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      toast.error("Please select a star rating.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
          images: uploadedImages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to submit review.");
        return;
      }

      toast.success("Review submitted successfully! Thank you for your feedback.");

      // Append the live approved review immediately to the UI list
      if (data.review) {
        const newReviewItem = {
          id: data.review._id || data.review.id,
          productId: data.review.productId,
          userName: session?.user?.name || "Anonymous",
          userId: session?.user?.id || "",
          userAvatar: session?.user?.image || undefined,
          rating: data.review.rating,
          title: data.review.title,
          body: data.review.comment || data.review.body || "",
          images: data.review.images || [],
          createdAt: new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          verified: data.review.isVerifiedPurchase || false,
          reviewNumber: localReviews.filter((r) => r.userId === session?.user?.id).length + 1,
          helpfulVotes: 0,
        };
        setLocalReviews((prev) => {
          const updatedPrev = prev.map((r) => {
            if (r.userId === session?.user?.id) {
              return { ...r, rating: data.review.rating };
            }
            return r;
          });
          return [newReviewItem, ...updatedPrev];
        });
      }

      setSubmitted(true);
      setTitle("");
      setComment("");
      setRating(5);
      setUploadedImages([]);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone."))
      return;

    try {
      const res = await fetch(`/api/reviews?id=${reviewId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete review.");
        return;
      }

      toast.success("Review deleted successfully!");
      setLocalReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete review. Please try again.");
    }
  };

  const handleHelpfulVote = async (reviewId: string) => {
    if (votedReviews.includes(reviewId)) return;

    if (status !== "authenticated") {
      toast.error("Please sign in to vote on reviews.");
      return;
    }

    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to submit vote.");
        return;
      }

      toast.success("Thanks for your feedback!");

      // Update localReviews helpful count
      setLocalReviews((prev) =>
        prev.map((r) => {
          if (r.id === reviewId) {
            return { ...r, helpfulVotes: (r.helpfulVotes || 0) + 1 };
          }
          return r;
        }),
      );

      // Update votedReviews
      const updatedVotes = [...votedReviews, reviewId];
      setVotedReviews(updatedVotes);
      if (typeof window !== "undefined") {
        localStorage.setItem("rbh-helpful-votes", JSON.stringify(updatedVotes));
      }
    } catch (err) {
      console.error("Helpful vote error:", err);
      toast.error("Failed to submit vote. Please try again.");
    }
  };

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setLightboxImages([]);
  };

  const handlePrevLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : lightboxImages.length - 1));
  };

  const handleNextLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev !== null && prev < lightboxImages.length - 1 ? prev + 1 : 0));
  };

  // Helper to render stars
  const renderStars = (count: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => {
          const starValue = i + 1;
          const isFilled = interactive ? starValue <= (hoverRating ?? rating) : starValue <= count;

          return (
            <Star
              key={i}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              onClick={() => interactive && setRating(starValue)}
              className={`transition-all duration-150 ${
                interactive ? "h-6 w-6 cursor-pointer hover:scale-110" : "h-4 w-4"
              } ${isFilled ? "fill-brass text-brass" : "text-muted/40 hover:text-brass/70"}`}
            />
          );
        })}
      </div>
    );
  };

  // Statistics Calculation
  // Group reviews by user to compute industry-level stats matching the backend logic (one rating count per user)
  const reviewsByUser: Record<string, ProductReview[]> = {};
  localReviews.forEach((r) => {
    const uId = r.userId || "anonymous";
    if (!reviewsByUser[uId]) {
      reviewsByUser[uId] = [];
    }
    reviewsByUser[uId].push(r);
  });

  const uniqueUserReviews = Object.values(reviewsByUser).map((userReviews) => {
    return userReviews.reduce((highest, current) => {
      return current.rating > highest.rating ? current : highest;
    });
  });

  const totalCount = uniqueUserReviews.length;
  const averageRating =
    totalCount > 0
      ? parseFloat(
          (uniqueUserReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1),
        )
      : 0;

  const ratingCounts = [0, 0, 0, 0, 0]; // Index 0 = 1 star, Index 4 = 5 star
  uniqueUserReviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingCounts[r.rating - 1]++;
    }
  });

  // Check if current user has already reviewed the product
  const userHasReviewed =
    session?.user?.id && localReviews.some((r) => r.userId === session.user.id);
  const isAdmin = session?.user && (session.user as any).role === "admin";

  // Filter & Sort Reviews
  const filteredReviews = localReviews
    .filter((r) => filterRating === null || r.rating === filterRating)
    .filter((r) => !verifiedOnly || r.verified)
    .sort((a, b) => {
      if (sortBy === "helpful") return (b.helpfulVotes || 0) - (a.helpfulVotes || 0);
      if (sortBy === "high") return b.rating - a.rating;
      if (sortBy === "low") return a.rating - b.rating;
      // "recent" sort
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <section className="mt-16 md:mt-24 max-w-4xl border-t border-border/70 pt-16">
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-charcoal mb-8">
        Customer Reviews
      </h2>

      {/* Review Dashboard Statistics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-card border border-border/80 rounded-2xl p-6 md:p-8 mb-10 shadow-sm">
        {/* Left Side: Summary */}
        <div className="flex flex-col justify-center items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-border/70 pb-6 md:pb-0 md:pr-8">
          <div className="text-5xl font-serif font-black text-charcoal">
            {averageRating || "0.0"}
          </div>
          <div className="mt-2.5">{renderStars(Math.round(averageRating))}</div>
          <p className="text-xs text-muted-foreground mt-3 font-medium">
            Based on {totalCount} {totalCount === 1 ? "rating" : "ratings"}
          </p>
        </div>

        {/* Right Side: Rating Bars */}
        <div className="col-span-1 md:col-span-2 flex flex-col justify-center gap-2.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingCounts[stars - 1];
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            const isActiveFilter = filterRating === stars;
            return (
              <button
                key={stars}
                onClick={() => setFilterRating(isActiveFilter ? null : stars)}
                className={`flex items-center gap-3 w-full group text-left cursor-pointer outline-none py-0.5 px-2 rounded-lg hover:bg-muted/50 transition-colors ${
                  isActiveFilter
                    ? "bg-muted font-bold text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-xs font-semibold w-12 shrink-0 flex items-center gap-0.5">
                  {stars} <Star className="h-3 w-3 fill-brass text-brass inline" />
                </span>
                <div className="flex-grow h-2.5 bg-muted rounded-full overflow-hidden border border-border/10">
                  <div
                    className="h-full bg-brass rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-semibold w-10 text-right shrink-0">{pct}%</span>
                <span className="text-[10px] text-muted-foreground/60 w-8 text-right shrink-0">
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Write review controls / warning notes */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="text-sm text-muted-foreground">
          {filterRating !== null ? (
            <span className="flex items-center gap-2">
              Showing reviews with {filterRating} stars ({filteredReviews.length} of{" "}
              {localReviews.length}).
              <button
                onClick={() => setFilterRating(null)}
                className="text-primary font-bold hover:underline cursor-pointer text-xs"
              >
                Show all reviews
              </button>
            </span>
          ) : (
            <span>
              Showing {filteredReviews.length} of {localReviews.length} reviews
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {status === "authenticated" && !submitted && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-sm hover:shadow cursor-pointer"
            >
              <MessageSquarePlus className="h-4 w-4" />
              {showForm ? "Close Form" : "Write a review"}
            </button>
          )}
        </div>
      </div>

      {/* Auth Prompt */}
      {status !== "authenticated" && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 text-center mb-8 shadow-sm">
          <p className="text-sm text-muted-foreground mb-4">
            Have you purchased this product? Sign in to share your thoughts.
          </p>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
            className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-xs font-bold hover:bg-primary/95 transition shadow-sm"
          >
            Sign In to Review
          </Link>
        </div>
      )}

      {/* Review Submission Form */}
      {showForm && !submitted && (
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-10 space-y-5 shadow-sm"
        >
          <h3 className="font-serif font-bold text-lg text-charcoal">Write a Review</h3>

          {/* Overall Rating */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Overall Rating <span className="text-destructive">*</span>
            </label>
            {renderStars(rating, true)}
            {oldestUserReview && (
              <p className="text-xs text-cognac font-semibold mt-1">
                Note: Updating this rating will also update your {userReviews.length} previous
                review{userReviews.length > 1 ? "s" : ""} for this product.
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Review Title <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Summarize your experience (e.g. Extremely comfortable, Great fit!)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Review Details <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <textarea
              placeholder="What did you like or dislike? How was the size, comfort, and quality?"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-none"
            />
          </div>

          {/* Image Upload Block */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Upload Images <span className="text-muted-foreground/50">(optional, up to 5)</span>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                className="hidden"
                disabled={isUploading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || uploadedImages.length >= 5}
                className="h-20 w-20 bg-muted hover:bg-muted/80 text-muted-foreground rounded-xl flex flex-col items-center justify-center gap-1 border border-dashed border-border transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    <span className="text-[10px] font-bold">Add Photo</span>
                  </>
                )}
              </button>

              {/* Thumbnails preview grid */}
              {uploadedImages.map((url, idx) => (
                <div
                  key={url}
                  className="relative h-20 w-20 rounded-xl overflow-hidden border border-border group shadow-sm"
                >
                  <img
                    src={url}
                    alt="Review upload preview"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveUploadedImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-background/80 hover:bg-background text-destructive rounded-full shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/70">
              Upload photos showing style fit or close-ups. Max 5MB per image.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setUploadedImages([]);
              }}
              className="px-5 py-2.5 text-xs rounded-full border border-border hover:bg-muted font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isUploading}
              className="px-6 py-2.5 text-xs rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Review Submitted Banner */}
      {submitted && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 mb-10 flex items-start gap-3.5 shadow-sm">
          <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Check className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-emerald-800">Thank You for Your Feedback!</h4>
            <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
              Your review was submitted successfully! It is now live on the catalog.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setShowForm(true);
              }}
              className="mt-3 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-semibold transition cursor-pointer border-0"
            >
              Write another review
            </button>
          </div>
        </div>
      )}

      {/* Filter & Sort Controls for Reviews List */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-muted/40 border border-border/50 rounded-xl px-4 py-3 mb-6 gap-4 animate-in fade-in duration-200">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            Reviews List
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/* Verified Only Checkbox */}
            <label className="flex items-center gap-2 text-xs font-semibold text-charcoal cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-opacity-20 cursor-pointer"
              />
              Verified Only
            </label>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-semibold">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-card border border-border/80 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none cursor-pointer text-charcoal shadow-sm transition hover:border-border"
              >
                <option value="recent">Most Recent</option>
                <option value="helpful">Most Helpful</option>
                <option value="high">Highest Rating</option>
                <option value="low">Lowest Rating</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border/80 bg-card rounded-2xl">
            <p className="text-muted-foreground text-sm italic">
              {filterRating !== null
                ? `No reviews with ${filterRating} stars yet.`
                : "No reviews yet for this style. Be the first to write one!"}
            </p>
          </div>
        ) : (
          filteredReviews.map((r) => {
            const isUserOwner = session?.user?.id === r.userId;
            const canDelete = isUserOwner || isAdmin;
            return (
              <div
                key={r.id}
                className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm flex gap-4 items-start relative group transition-shadow hover:shadow"
              >
                {/* User Avatar */}
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase shrink-0 overflow-hidden border border-border/10">
                  {r.userAvatar ? (
                    <img src={r.userAvatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span>{r.userName.charAt(0)}</span>
                  )}
                </div>

                {/* Review Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <div>
                      <span className="font-bold text-sm text-charcoal mr-2">{r.userName}</span>
                      {r.reviewNumber !== undefined && (
                        <span className="inline-flex items-center text-[9px] text-brass font-bold bg-brass/10 border border-brass/20 px-1.5 py-0.5 rounded-full mr-2">
                          Review #{r.reviewNumber}
                        </span>
                      )}
                      {r.verified && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                          ✓ Verified Purchase
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {r.createdAt}
                    </span>
                  </div>

                  {/* Rating Stars */}
                  <div className="mb-3">{renderStars(r.rating)}</div>

                  {/* Title & Comment */}
                  {r.title && <h4 className="font-bold text-sm text-charcoal mb-1.5">{r.title}</h4>}
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {r.body}
                  </p>

                  {/* Review Images Gallery */}
                  {r.images && r.images.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 mt-4">
                      {r.images.map((imgUrl, imgIdx) => (
                        <button
                          key={imgUrl}
                          onClick={() => openLightbox(r.images, imgIdx)}
                          className="h-16 w-16 rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors shadow-sm cursor-pointer shrink-0"
                        >
                          <img
                            src={imgUrl}
                            alt="Review photo thumbnail"
                            className="h-full w-full object-cover hover:scale-105 transition-transform"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Helpful Vote Button */}
                  <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleHelpfulVote(r.id)}
                        disabled={votedReviews.includes(r.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer select-none border ${
                          votedReviews.includes(r.id)
                            ? "bg-cognac/10 text-cognac border-cognac/20 cursor-default"
                            : "bg-background hover:bg-muted text-muted-foreground border-border/80 hover:border-border"
                        }`}
                      >
                        {votedReviews.includes(r.id) && <Check className="h-3.5 w-3.5" />}
                        <span>{votedReviews.includes(r.id) ? "Helpful" : "Helpful?"}</span>
                        {r.helpfulVotes !== undefined && r.helpfulVotes > 0 && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              votedReviews.includes(r.id)
                                ? "bg-cognac/20 text-cognac"
                                : "bg-muted-foreground/10 text-muted-foreground"
                            }`}
                          >
                            {r.helpfulVotes}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Delete Button (visible to owner or admin) */}
                {canDelete && (
                  <button
                    onClick={() => handleDeleteReview(r.id)}
                    className="p-2 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/5 rounded-full transition-colors cursor-pointer self-start -mt-2 -mr-2 shadow-none border-0"
                    title="Delete review"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Lightbox Modal / Overlay */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-charcoal/95 z-[9999] flex flex-col items-center justify-center backdrop-blur-sm p-4 animate-fade-in"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 p-2 bg-background/10 hover:bg-background/20 text-white rounded-full transition cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Centered Image Container */}
          <div
            className="relative max-w-4xl max-h-[80vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImages[lightboxIndex]}
              alt="High resolution review view"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-300"
            />

            {/* Navigation buttons */}
            {lightboxImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevLightbox}
                  className="absolute left-4 p-3 bg-background/20 hover:bg-background/40 text-white rounded-full transition cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNextLightbox}
                  className="absolute right-4 p-3 bg-background/20 hover:bg-background/40 text-white rounded-full transition cursor-pointer"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Indicator Info */}
          <div className="absolute bottom-6 text-sm text-white/60 font-semibold">
            {lightboxIndex + 1} of {lightboxImages.length}
          </div>
        </div>
      )}
    </section>
  );
}
