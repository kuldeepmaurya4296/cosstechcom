# Quotation — Raja Boot House E-Commerce Platform

**Prepared by:** Cosstech India
**Prepared for:** Raja Boot House
**Date:** 24 June 2026
**Quotation No.:** RBH-ECOM-2026-001
**Validity:** 15 days from date of issue

---

## 1. Project Summary

A complete, production-ready e-commerce platform for Raja Boot House — a premium leather
footwear brand. Built on a modern, fast, SEO-optimised stack (Next.js App Router, MongoDB,
Razorpay) and ready for deployment on Vercel with zero additional infrastructure cost.

This quotation covers the **full platform already delivered** plus the **essential
completion items** required to make it legally and operationally ready to go live —
all delivered same-day.

---

## 2. Features Delivered (Already Built)

### A. Storefront & Catalog
- Product catalogue with size/colour variants, per-variant stock & images
- Filtering by category, brand, gender, occasion + full-text search
- Categories, brands, collections, banners, announcements
- Product detail pages with image gallery, share, recently-viewed
- SEO suite: server-rendered pages, JSON-LD structured data, sitemap, robots rules
- Premium brand UI with smooth animations (mobile + desktop)

### B. Cart, Checkout & Payments
- Server-synced shopping cart
- 3-step checkout (address → shipping → payment)
- **Razorpay** integration — UPI, Card, Net Banking, Wallet + Cash on Delivery
- Secure payment signature verification + webhook handling
- Server-side price re-computation (fraud-proof — client prices never trusted)
- Atomic stock deduction with automatic rollback on failure
- Human-readable sequential order IDs (RBH-XXXXX)

### C. Customer Accounts
- Email/password login (encrypted) + Google sign-in
- Forgot/reset password via email
- Profile management, multiple saved addresses
- Order history + invoice view
- Wishlist
- **Loyalty points** — 5% earned on delivery, redeemable at checkout

### D. Orders & Fulfilment
- Full order lifecycle (Placed → Confirmed → Packed → Shipped → Out for Delivery → Delivered)
- Cancellation, return & refund states with status history & audit log
- **Real Razorpay refunds** to original payment method
- Customer self-cancel with automatic stock restoration

### E. Marketing Tools
- Coupons (flat / percentage / free-shipping, min-cart, usage limits, validity windows)
- Flash sales (time-limited, percentage or flat discounts)
- Product reviews & ratings (verified-purchase, helpful votes, photos)
- Newsletter subscribe/unsubscribe
- Automated abandoned-cart recovery emails

### F. Admin Panel
- Dashboard — live revenue, sales chart, top products, low-stock alerts
- Product / category / brand / collection management
- **Bulk product import via CSV** + CSV order export
- Order management, refund payouts export, printable shipping labels
- Coupons, flash sales, customers, reviews, CMS content, store settings
- Delivery-partner management + admin activity log

### G. Vendor Portal
- Vendor dashboard, products, orders, payouts & settings

### H. Infrastructure
- Image uploads via Vercel Blob (with local fallback)
- Transactional email (order confirmation, status updates, welcome)
- API rate-limiting, robust MongoDB Atlas connection handling
- Zero-config Vercel deployment

---

## 3. Essential Completion Items (Delivered Today)

These are the minimum gaps required for a safe, legal, production launch. All are
quick to build on the existing codebase and will be completed in the same delivery.

| # | Item | Why it matters |
|---|------|----------------|
| 1 | **Secrets hardening** — remove live credentials from repo, rotate keys, add placeholder env template | Security — prevents credential leak |
| 2 | **GST persisted per order** — freeze CGST/SGST + tax rate on each order & invoice at purchase time | Legal — correct GST invoices & filing in India |
| 3 | **Razorpay amount hardening** — payment amount derived from the saved order, never from client input | Closes payment-tampering edge case |
| 4 | **Push-notification cleanup** — remove the dead/partial web-push stub & rotate the exposed VAPID key | Security + clean build |
| 5 | **Order tracking link** — surface the delivery-partner tracking URL to customers in their order page | Customer experience / support load |
| 6 | **Customer return-request flow** — simple "Request Return" action wired to existing return states | Completes the already-built returns backend |

---

## 4. Commercials

| Description | Amount (₹) |
|-------------|-----------:|
| Full e-commerce platform — all features in Section 2 | 24,000 |
| Essential completion items — Section 3 (same-day) | 6,000 |
| **Total** | **30,000** |

**Tax:** As applicable (GST extra if registered).
**Payment terms:** 50% advance, 50% on delivery / go-live.

### Included
- Same-day delivery of all items above
- Deployment to Vercel (production)
- Basic handover walkthrough

### Not Included (available as add-ons)
- SMS / WhatsApp transactional notifications (gateway charges extra)
- Courier API live-tracking integration (beyond static tracking link)
- Automated test suite
- Ongoing maintenance / AMC
- Third-party gateway, domain & hosting fees beyond Vercel free tier

---

## 5. Optional Future Add-Ons (Separate Quote)

- SMS/WhatsApp order & OTP notifications
- Live courier tracking + serviceability by pincode
- Back-in-stock & price-drop alerts
- Product Q&A, size guide, related-product recommendations
- Weight/zone-based shipping rate engine
- Analytics & conversion pixels (GA, Meta)
- Redis-backed rate limiting for scale
- Automated test coverage

---

*This quotation is an estimate based on the current scope. Any change in scope will be
quoted separately. — Cosstech India*
