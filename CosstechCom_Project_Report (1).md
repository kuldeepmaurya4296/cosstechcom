**PROJECT REPORT & DEVELOPMENT PLAN**

**CosstechCom**

_Multi-Vendor E-Commerce Marketplace_

Production-Grade Platform - Scalable, Compliant & Secure

| **Field**        | **Value**                    |
| ---------------- | ---------------------------- |
| Document Version | 2.0 (Robust Plan)            |
| Date             | 24 June 2026                 |
| Prepared By      | Development Team             |
| Project Type     | Full Platform Transformation |
| Status           | Planning & Approval Phase    |

# 1\. Executive Summary

This project transforms the existing Raja Boot House single-vendor footwear e-commerce application into CosstechCom - a full-featured, Flipkart-style multi-vendor marketplace. The platform supports unlimited vendor onboarding, multi-category product listings (electronics, fashion, grocery, home, appliances, electrical, sports, beauty, books, etc.), automated order splitting, commission-based payouts, and 5 distinct user dashboards.

_Version 2.0 of this plan hardens the original scope into a production-ready system. It closes critical gaps identified for a real-world Indian marketplace: split-settlement payments, vendor KYC, shipping-aggregator integration, SMS/WhatsApp notifications, GST/TCS tax compliance, asynchronous processing, caching, search infrastructure, fraud controls, security hardening, and an automated testing/CI pipeline. The effort estimate has also been revised to reflect this realistic scope._

## Key Metrics

| **Metric**                      | **Value**                                                        |
| ------------------------------- | ---------------------------------------------------------------- |
| Total Features                  | 110+                                                             |
| Data Models                     | 38+ (up from 18)                                                 |
| API Endpoints                   | 90+                                                              |
| Dashboard Portals               | 5 (Admin, Vendor, Customer, Delivery, Support)                   |
| Product Categories              | 10 Departments, 50+ Sub-categories                               |
| User Roles                      | 5 + granular sub-admin permissions                               |
| Third-Party Integrations        | 12+ (payments, shipping, SMS, WhatsApp, KYC, search, monitoring) |
| Estimated Files Changed/Created | 250+                                                             |

# 2\. Technology Stack

Core stack retained from the original build; production-grade infrastructure layers added (marked NEW) to support scale, reliability, and compliance.

| **Layer**                  | **Technology**                           | **Justification**                                      |
| -------------------------- | ---------------------------------------- | ------------------------------------------------------ |
| Frontend                   | Next.js 16 (React 19, App Router)        | SSR/SSG for SEO, API routes for backend                |
| Language                   | TypeScript 5.8                           | Type safety across full stack                          |
| Database                   | MongoDB Atlas (Mongoose 9)               | Flexible schema for multi-category products            |
| Authentication             | NextAuth v5 (JWT + Google OAuth)         | Multi-role auth with session management                |
| Styling                    | TailwindCSS v4                           | Rapid UI development                                   |
| Payments                   | Razorpay + Razorpay Route                | UPI/Cards/NetBanking/COD + split vendor settlements    |
| File Storage               | Vercel Blob                              | Product images, vendor KYC documents                   |
| Email                      | Nodemailer (SMTP/Gmail)                  | Transactional notifications                            |
| Animation                  | Framer Motion                            | Premium UI micro-interactions                          |
| Hosting                    | Vercel                                   | Edge deployment, auto-scaling                          |
| Caching / Rate-Limit (NEW) | Upstash Redis                            | API caching, rate limiting, session store, hot data    |
| Background Jobs (NEW)      | QStash / BullMQ + Vercel Cron            | Async order split, payouts, emails, indexing           |
| Search (NEW)               | MongoDB Atlas Search                     | Fast faceted full-text search at scale (vs slow regex) |
| Shipping (NEW)             | Shiprocket / Delhivery API               | Serviceability, rate calc, AWB, label, live tracking   |
| SMS & OTP (NEW)            | MSG91 / Twilio                           | OTP login, order/delivery SMS alerts                   |
| WhatsApp (NEW)             | WhatsApp Business API (Interakt/Gupshup) | Order updates, abandoned-cart, support                 |
| KYC / Verification (NEW)   | Cashfree / Razorpay APIs                 | GSTIN + PAN verify, bank penny-drop                    |
| Monitoring (NEW)           | Sentry + Vercel Analytics / PostHog      | Error tracking, uptime, product analytics              |
| Testing / CI (NEW)         | Vitest, Playwright, GitHub Actions       | Automated unit/E2E + CI gating                         |

# 3\. Complete Feature List by Module

Features marked (NEW) are additions in v2.0 to make the platform production-ready. Priorities: P0 Critical, P1 High, P2 Medium.

## 3.1 Customer Storefront (23 Features)

| **#** | **Feature**                   | **Description**                                                           | **Priority** | **Phase** |
| ----- | ----------------------------- | ------------------------------------------------------------------------- | ------------ | --------- |
| C01   | Homepage Redesign             | Flipkart-style: deal banners, category icons, trending, vendor spotlights | P0           | Phase 1   |
| C02   | Mega Menu Navigation          | 3-level category dropdown with icons, images, hover-activated             | P0           | Phase 1   |
| C03   | Advanced Search               | Atlas Search: autocomplete, typo tolerance, category filtering, history   | P0           | Phase 1   |
| C04   | Shop Page Filters             | Category tree, price, brand, rating, discount %, vendor, availability     | P0           | Phase 1   |
| C05   | Product Detail Page           | Vendor card, PIN delivery check, specs table, Q&A, similar products       | P0           | Phase 1   |
| C06   | Multi-Vendor Cart             | Items grouped by vendor, per-vendor shipping, vendor coupons              | P0           | Phase 2   |
| C07   | Unified Checkout              | Single checkout for multi-vendor cart, wallet usage, address management   | P0           | Phase 2   |
| C08   | Order Tracking                | Per-sub-order tracking with live courier status, delivery partner info    | P0           | Phase 2   |
| C09   | Return & Exchange             | Self-serve return/exchange, reason selection, pickup scheduling           | P0           | Phase 2   |
| C10   | Product Reviews               | Star rating, text + image reviews, verified badge, helpfulness voting     | P1           | Phase 3   |
| C11   | Wishlist                      | Save products, share wishlist, "Move to Cart" action                      | P1           | Phase 3   |
| C12   | Product Comparison            | Compare up to 4 products side-by-side on specifications                   | P1           | Phase 3   |
| C13   | Buy Again                     | Quick reorder from order history with one click                           | P1           | Phase 3   |
| C14   | Customer Wallet               | Platform wallet for refunds, cashback, loyalty credits                    | P1           | Phase 3   |
| C15   | PIN Code Delivery Check       | Real serviceability + ETA via shipping aggregator API                     | P1           | Phase 3   |
| C16   | Notifications Center          | In-app bell: order updates, offers, price drops                           | P2           | Phase 4   |
| C17   | Recently Viewed               | Auto-tracked browsing history with product carousel                       | P2           | Phase 4   |
| C18   | Share Product                 | Share links to WhatsApp, social media, copy link                          | P2           | Phase 4   |
| C19   | OTP / Phone Login (NEW)       | SMS OTP login + mobile verification (primary auth in India)               | P0           | Phase 1   |
| C20   | Abandoned Cart Recovery (NEW) | Auto WhatsApp/email nudge for carts left idle, with deep link             | P2           | Phase 4   |
| C21   | Live Chat / Help (NEW)        | In-app chat widget + FAQ chatbot routed to support tickets                | P2           | Phase 4   |
| C22   | Referral Program (NEW)        | Refer-and-earn wallet credit, unique codes, referral tracking             | P2           | Phase 4   |
| C23   | EMI / Pay-Later Options (NEW) | Display EMI + Pay-Later (Razorpay) on PDP & checkout                      | P2           | Phase 4   |

## 3.2 Vendor Portal (18 Features)

| **#** | **Feature**                     | **Description**                                                    | **Priority** | **Phase** |
| ----- | ------------------------------- | ------------------------------------------------------------------ | ------------ | --------- |
| V01   | Vendor Registration             | "Sell on CosstechCom" landing + registration with business details | P0           | Phase 1   |
| V02   | Vendor Dashboard                | Revenue, orders, seller score, low-stock alerts, action items      | P0           | Phase 2   |
| V03   | Product Management              | Add/edit/delete products, variant management, image upload         | P0           | Phase 2   |
| V04   | Order Management                | Sub-orders, status (Confirm→Pack→Ship), auto shipping labels       | P0           | Phase 2   |
| V05   | Payout Management               | Earnings, commission breakdown, request payouts, history           | P0           | Phase 2   |
| V06   | Inventory Management            | Stock tracking, low-stock alerts, bulk stock updates               | P0           | Phase 2   |
| V07   | Vendor Storefront               | Public profile /store/\[slug\] with all vendor products            | P1           | Phase 3   |
| V08   | Vendor Coupons                  | Create vendor-specific discount coupons                            | P1           | Phase 3   |
| V09   | Vendor Analytics                | Sales trends, top products, demographics, conversion metrics       | P1           | Phase 3   |
| V10   | Review Management               | View and reply to customer reviews                                 | P1           | Phase 3   |
| V11   | Return Processing               | Accept/reject return requests, coordinate pickup                   | P1           | Phase 3   |
| V12   | Seller Score                    | Cancellation rate, return rate, response time, delivery SLA        | P2           | Phase 4   |
| V13   | Vendor Communication            | In-app messaging with support team                                 | P2           | Phase 4   |
| V14   | Bulk Product Upload             | CSV/Excel import for batch creation with validation                | P2           | Phase 4   |
| V15   | KYC & Verification (NEW)        | GSTIN + PAN verify, bank penny-drop, document upload + review      | P0           | Phase 1   |
| V16   | Shipping Integration (NEW)      | One-click AWB, label, pickup request, rate calc per order          | P0           | Phase 2   |
| V17   | Vendor Agreement / e-Sign (NEW) | Accept seller terms, commission schedule, digital signature        | P1           | Phase 1   |
| V18   | Vendor Notifications (NEW)      | SMS/WhatsApp/email for new orders, payouts, low stock, SLA breach  | P1           | Phase 3   |

## 3.3 Super Admin Console (25 Features)

| **#** | **Feature**                    | **Description**                                                      | **Priority** | **Phase** |
| ----- | ------------------------------ | -------------------------------------------------------------------- | ------------ | --------- |
| A01   | Platform Dashboard             | GMV, commission revenue, vendor/customer count, growth KPIs          | P0           | Phase 1   |
| A02   | Vendor Management              | Approve/reject/suspend vendors, view performance metrics             | P0           | Phase 1   |
| A03   | Product Approval               | Review pending products, approve/reject, trusted-vendor auto-approve | P0           | Phase 2   |
| A04   | Category Management            | 3-level hierarchy CRUD, commission rates, attribute templates        | P0           | Phase 1   |
| A05   | Order Overview                 | All orders, sub-order drill-down, status filters, export             | P0           | Phase 2   |
| A06   | Payout Processing              | Review requests, batch process, mark completed, history              | P0           | Phase 2   |
| A07   | Commission Configuration       | Set rates by category, vendor tier, or product type                  | P0           | Phase 1   |
| A08   | Platform Settings              | Store name, payment toggles, email config, shipping rules            | P0           | Phase 1   |
| A09   | Customer Management            | View/deactivate customers, order history, wallet, disputes           | P1           | Phase 3   |
| A10   | Banner & CMS                   | Homepage banners, deal sections, category banners, announcements     | P1           | Phase 3   |
| A11   | Coupon Management              | Platform-wide and category coupons, usage tracking                   | P1           | Phase 3   |
| A12   | Flash Sales                    | Time-limited deals, vendor-nominated products, countdown             | P1           | Phase 3   |
| A13   | Review Moderation              | Approve/reject reviews, flag inappropriate, moderation queue         | P1           | Phase 3   |
| A14   | Dispute Resolution             | View escalated disputes, assign to support, take action              | P1           | Phase 3   |
| A15   | Tax & GST Management           | GST rates per category, HSN codes, tax reports                       | P1           | Phase 3   |
| A16   | Platform Analytics             | Revenue trends, category performance, vendor leaderboard             | P1           | Phase 3   |
| A17   | Delivery Partner Mgmt          | Add/manage partners, assign zones, track performance                 | P1           | Phase 3   |
| A18   | Notification Management        | Platform-wide announcements, email/WhatsApp campaigns                | P2           | Phase 4   |
| A19   | Audit & Activity Log           | Track all admin actions, vendor changes, security events             | P2           | Phase 4   |
| A20   | Reports Export                 | CSV/PDF export for orders, payouts, revenue, tax                     | P2           | Phase 4   |
| A21   | TCS / TDS Compliance (NEW)     | GST Sec-52 TCS collection + reports, vendor-wise TCS/TDS statements  | P0           | Phase 3   |
| A22   | Fraud & Risk Engine (NEW)      | Flag suspicious orders, fake reviews, COD abuse, velocity checks     | P1           | Phase 4   |
| A23   | Sub-Admin Roles & RBAC (NEW)   | Granular permission sets, scoped staff accounts, impersonation       | P1           | Phase 1   |
| A24   | Reconciliation Dashboard (NEW) | Match payments ↔ commission ↔ payouts ↔ refunds; settlement ledger   | P0           | Phase 2   |
| A25   | Marketing & Campaigns (NEW)    | Abandoned-cart, segment push, referral config, promo scheduling      | P2           | Phase 4   |

## 3.4 Delivery Partner Dashboard (4 Features)

| **#** | **Feature**                | **Description**                                                         | **Priority** | **Phase** |
| ----- | -------------------------- | ----------------------------------------------------------------------- | ------------ | --------- |
| D01   | Delivery Dashboard         | Assigned orders, today's pickups, delivery stats                        | P1           | Phase 3   |
| D02   | Order Status Updates       | Picked Up → In Transit → Delivered with photo proof                     | P1           | Phase 3   |
| D03   | Delivery History           | Past deliveries with earnings summary                                   | P2           | Phase 4   |
| D04   | COD Collection & OTP (NEW) | Record COD cash collected + delivery OTP confirmation, daily settlement | P1           | Phase 3   |

## 3.5 Support Agent Panel (4 Features)

| **#** | **Feature**             | **Description**                                                     | **Priority** | **Phase** |
| ----- | ----------------------- | ------------------------------------------------------------------- | ------------ | --------- |
| S01   | Support Dashboard       | Open tickets, assigned disputes, priority queue                     | P2           | Phase 4   |
| S02   | Ticket Management       | View details, order info, communication history                     | P2           | Phase 4   |
| S03   | Resolution Actions      | Issue refund, partial refund, close ticket, escalate                | P2           | Phase 4   |
| S04   | Live Chat Console (NEW) | Real-time customer chat handoff from bot, canned replies, SLA timer | P2           | Phase 4   |

## 3.6 Backend Infrastructure (30 Features)

| **#** | **Feature**                           | **Description**                                                        | **Priority** | **Phase** |
| ----- | ------------------------------------- | ---------------------------------------------------------------------- | ------------ | --------- |
| B01   | Brand Rebrand                         | All "Raja Boot House" → "CosstechCom" (~60 files)                      | P0           | Phase 1   |
| B02   | Theme Overhaul                        | Leather palette → marketplace blue/orange theme                        | P0           | Phase 1   |
| B03   | Database Migration                    | New MongoDB collection "cosstechcom" with fresh seed data              | P0           | Phase 1   |
| B04   | Data Model Expansion                  | 18 → 38+ Mongoose models with multi-vendor support                     | P0           | Phase 1   |
| B05   | 5-Role RBAC                           | Customer, Admin, Vendor, Delivery Partner, Support roles               | P0           | Phase 1   |
| B06   | Order Splitting Engine                | Auto-split orders into vendor-specific sub-orders                      | P0           | Phase 2   |
| B07   | Commission Engine                     | Auto-calculate platform commission per sub-order                       | P0           | Phase 2   |
| B08   | Payout System                         | Vendor payout request, approval, batch processing                      | P0           | Phase 2   |
| B09   | Product Approval Workflow             | Pending → Admin Review → Approved/Rejected pipeline                    | P0           | Phase 2   |
| B10   | Wallet System                         | Customer wallet with credit/debit transactions                         | P1           | Phase 3   |
| B11   | Dispute System                        | Ticket creation, investigation, resolution, refund actions             | P1           | Phase 3   |
| B12   | Notification System                   | In-app notifications for all user roles                                | P1           | Phase 3   |
| B13   | Tax/GST Engine                        | Per-category tax configuration and calculation                         | P1           | Phase 3   |
| B14   | Email Templates                       | Rebranded transactional emails for all flows                           | P1           | Phase 3   |
| B15   | Seed Data Script                      | 100+ products, 50+ categories, 13+ users, banners, coupons             | P0           | Phase 1   |
| B16   | Legal Policies                        | Privacy, terms, delivery, refund, seller policies                      | P1           | Phase 3   |
| B17   | SEO & Metadata                        | Sitemap, robots, OG tags, structured data for marketplace              | P1           | Phase 3   |
| B18   | Redis Caching Layer (NEW)             | Cache catalog, category tree, settings; reduce DB load                 | P1           | Phase 2   |
| B19   | Background Job Queue (NEW)            | Async order-split, payouts, emails, indexing, webhooks                 | P0           | Phase 2   |
| B20   | Rate Limiting & API Security (NEW)    | Per-IP/user limits, CAPTCHA, input sanitization, CORS, helmet          | P0           | Phase 1   |
| B21   | Shipping Aggregator Integration (NEW) | Serviceability, rate, AWB, label, pickup, tracking webhooks            | P0           | Phase 2   |
| B22   | SMS / WhatsApp Channel (NEW)          | OTP + transactional + campaign messaging gateway abstraction           | P0           | Phase 1   |
| B23   | Inventory Reservation (NEW)           | Atomic stock decrement, hold-on-checkout, overselling prevention       | P0           | Phase 2   |
| B24   | Search Indexing (NEW)                 | Atlas Search index sync on product create/update/delete                | P1           | Phase 1   |
| B25   | Per-Vendor GST Invoicing (NEW)        | Auto tax-invoice per sub-order with seller GSTIN, HSN, e-invoice ready | P0           | Phase 3   |
| B26   | Wallet Ledger Integrity (NEW)         | Double-entry ledger, idempotent txns, no negative balance              | P1           | Phase 3   |
| B27   | Webhook System (NEW)                  | Razorpay/Shiprocket inbound events + signature verify + retries        | P0           | Phase 2   |
| B28   | Observability (NEW)                   | Sentry errors, structured logs, /health checks, uptime alerts          | P1           | Phase 4   |
| B29   | Automated Backups & DR (NEW)          | Atlas continuous backup, restore runbook, env/secret backup            | P1           | Phase 4   |
| B30   | Refund Engine (NEW)                   | Auto refund-to-source or wallet, partial refunds, reconciliation       | P0           | Phase 2   |

# 4\. Security & Data Protection

Security is a first-class requirement, not an afterthought. The following controls are built into the relevant phases rather than bolted on at the end.

| **Area**                     | **Controls**                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Authentication               | JWT with short expiry + refresh, OTP for phone login, optional 2FA for admin/vendor, secure httpOnly cookies, brute-force lockout |
| Authorization                | Role-based middleware on every API route, vendor data isolation (vendor sees only own data), granular sub-admin permissions       |
| Input / Injection            | Server-side validation (Zod), Mongoose sanitization, NoSQL-injection guards, file-type/size limits on uploads                     |
| Web (OWASP Top 10)           | CSRF protection, secure headers (helmet/CSP), XSS escaping, rate limiting, CAPTCHA on auth & checkout                             |
| Payments / PCI               | No card data stored - tokenized via Razorpay; webhook signature verification; idempotency keys on payment & payout                |
| Secrets                      | All keys in Vercel env vars, never committed; rotate on staff change; least-privilege API tokens                                  |
| Data Privacy (DPDP Act 2023) | Consent capture, data-access/erasure requests, PII encryption at rest, access logging, retention policy                           |
| Auditability                 | Immutable admin/vendor action log, security-event alerts, anomaly detection on payouts & refunds                                  |

# 5\. Scalability & Performance

Patterns to keep the marketplace fast and stable as catalog, vendors, and traffic grow.

| **Concern** | **Approach**                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| Database    | Compound indexes on hot queries, .lean() reads, connection pooling, projection to limit fields, avoid N+1 populates        |
| Caching     | Redis for category tree, settings, product cards; Next.js unstable_cache + tag revalidation on admin writes                |
| Search      | MongoDB Atlas Search (not regex) for faceted, typo-tolerant queries; async index sync                                      |
| Async Work  | Job queue for order-split, payout batches, emails, SMS, invoice gen, webhook processing - keeps requests fast              |
| Media       | Vercel Blob + next/image optimization, responsive sizes, lazy loading, WebP                                                |
| Frontend    | SSG/ISR for catalog pages, route prefetch, code-splitting, pagination/infinite scroll (no full-collection loads)           |
| Edge / CDN  | Vercel edge caching for static + cacheable API responses; stale-while-revalidate                                           |
| Resilience  | Idempotent writes, retry with backoff on third-party calls, circuit-breaker on shipping/payment APIs, graceful degradation |

# 6\. India Regulatory Compliance

A multi-vendor marketplace operating in India carries legal obligations beyond a single-seller store. These are mandatory, not optional, and must be designed in from Phase 1-3.

| **Requirement**                             | **What It Means for CosstechCom**                                                                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| GST Registration & Invoicing                | Each sub-order needs a tax invoice in the SELLING vendor's GSTIN with correct HSN, CGST/SGST/IGST split by buyer state                   |
| TCS - GST Section 52                        | Marketplace MUST collect Tax Collected at Source (0.5%) on vendor sales, deposit it, and file GSTR-8 monthly; vendor-wise TCS statements |
| Vendor KYC                                  | Verify GSTIN, PAN, and bank account (penny-drop) before activation; store documents securely                                             |
| Consumer Protection (E-Commerce) Rules 2020 | Display seller identity, country of origin, grievance officer details, clear return/refund policy, no unfair trade practices             |
| DPDP Act 2023                               | Lawful consent for personal data, breach notification, data-principal rights (access/correction/erasure)                                 |
| Legal Metrology                             | For applicable goods: net quantity, MRP, manufacturer/importer details on listing                                                        |
| Grievance Redressal                         | Named grievance officer, defined SLA for complaint resolution, escalation path                                                           |

_Note: full e-invoicing (IRN/QR) applies above turnover thresholds - design invoices to be e-invoice ready so it can be switched on without rework._

# 7\. Development Timeline

## 7.1 Phase Overview (Task Schedule)

Day-by-day breakdown across the four delivery phases. For a live Gantt view, mirror this into Jira, Asana, or Notion. Day ranges below reflect the revised, robust scope (see 7.3 for the realistic effort note).

| **Phase** | **Task**                                          | **Day Range** |
| --------- | ------------------------------------------------- | ------------- |
| Phase 1   | Environment, DB, Redis & queue setup              | Day 1-2       |
| Phase 1   | Brand Rebrand (60 files)                          | Day 2-4       |
| Phase 1   | Theme & CSS Overhaul                              | Day 3-4       |
| Phase 1   | Data Models (38+ models)                          | Day 3-6       |
| Phase 1   | Auth, RBAC, OTP login, sub-admin perms            | Day 6-9       |
| Phase 1   | API security, rate limiting, SMS/WhatsApp gateway | Day 8-10      |
| Phase 1   | Seed Data + Category APIs + Search indexing       | Day 9-11      |
| Phase 2   | Vendor Management + KYC verification              | Day 12-16     |
| Phase 2   | Product Approval Workflow                         | Day 15-17     |
| Phase 2   | Order Splitting + Inventory Reservation           | Day 16-20     |
| Phase 2   | Commission, Payout & Reconciliation               | Day 19-23     |
| Phase 2   | Shipping integration + webhooks + refund engine   | Day 20-24     |
| Phase 2   | Vendor & Admin Dashboard UI                       | Day 17-24     |
| Phase 2   | Cart & Checkout (multi-vendor, EMI)               | Day 22-26     |
| Phase 3   | Storefront UI Redesign (Flipkart-style)           | Day 27-32     |
| Phase 3   | Wallet (ledger) & Loyalty                         | Day 28-30     |
| Phase 3   | Dispute Resolution System                         | Day 29-31     |
| Phase 3   | Reviews, Vendor Storefront, Search/Filters        | Day 31-35     |
| Phase 3   | Delivery Partner Dashboard + COD/OTP              | Day 30-33     |
| Phase 3   | Tax/GST + TCS + Per-vendor Invoicing              | Day 33-36     |
| Phase 3   | Email/SMS/WhatsApp templates + Legal pages        | Day 35-37     |
| Phase 4   | Notifications, Comparison, Bulk Upload/Export     | Day 38-41     |
| Phase 4   | Support Panel + Live Chat, Seller Score           | Day 40-43     |
| Phase 4   | Fraud engine, Referral, Abandoned cart            | Day 42-44     |
| Phase 4   | Observability, Backups, SEO & Performance         | Day 43-46     |
| Phase 4   | Automated tests + comprehensive QA + bug fixes    | Day 45-50     |
| Phase 4   | Final Build, Staging UAT & Production Deploy      | Day 50-52     |

## 7.2 Detailed Phase Breakdown

### Phase 1: Foundation & Setup (Est. 9-11 Days)

| **Day**  | **Tasks**                                                    | **Deliverables**                          |
| -------- | ------------------------------------------------------------ | ----------------------------------------- |
| Day 1-2  | ENV, MongoDB collection, Redis + job queue, dependency audit | Infra ready, "cosstechcom" DB active      |
| Day 2-4  | Brand rebrand (~60 files), logo/favicon                      | All "Raja Boot House" → "CosstechCom"     |
| Day 3-4  | Theme overhaul (globals.css, color tokens)                   | New marketplace blue/orange theme         |
| Day 3-6  | Data models (38+), search index schema                       | All Mongoose schemas + Atlas Search ready |
| Day 6-9  | Auth (5 roles), RBAC, OTP login, sub-admin perms             | Multi-role + phone login working          |
| Day 8-10 | API security, rate limiting, SMS/WhatsApp gateway            | Hardened APIs, OTP/messaging live         |
| Day 9-11 | Seed data, category APIs, search indexing                    | DB populated, search & categories live    |

**🏁 Milestone: App boots with new brand, new DB, hardened multi-role + OTP auth, search, seed data loaded.**

### Phase 2: Core Multi-Vendor Engine (Est. 14-16 Days)

| **Day**   | **Tasks**                                      | **Deliverables**                             |
| --------- | ---------------------------------------------- | -------------------------------------------- |
| Day 12-16 | Vendor mgmt APIs + KYC (GSTIN/PAN/bank verify) | Verified vendor onboarding flow              |
| Day 15-17 | Product approval workflow                      | Admin approve/reject vendor products         |
| Day 16-20 | Order splitting + inventory reservation        | Sub-orders + no overselling                  |
| Day 19-23 | Commission, payout, reconciliation ledger      | Auto commission, payouts, settlement matched |
| Day 20-24 | Shipping integration, webhooks, refund engine  | AWB/labels, live tracking, auto refunds      |
| Day 17-24 | Vendor + Admin dashboard UI                    | Both portals functional                      |
| Day 22-26 | Multi-vendor cart + checkout (EMI, wallet)     | Multi-vendor checkout working                |

**🏁 Milestone: Vendor → KYC → product → order → ship → payout → reconcile lifecycle working end-to-end.**

### Phase 3: Feature Build-Out (Est. 11-13 Days)

| **Day**   | **Tasks**                                       | **Deliverables**                         |
| --------- | ----------------------------------------------- | ---------------------------------------- |
| Day 27-32 | Homepage, Shop, PDP redesign (Flipkart-style)   | Modern marketplace UI live               |
| Day 28-30 | Customer wallet (double-entry ledger) & loyalty | Wallet credits/refunds with integrity    |
| Day 29-31 | Dispute resolution system                       | Customers raise disputes, admin resolves |
| Day 31-35 | Reviews, vendor storefront, search/filters      | Image reviews, profiles, faceted search  |
| Day 30-33 | Delivery partner dashboard + COD/OTP            | Delivery + COD settlement working        |
| Day 33-36 | Tax/GST + TCS (Sec 52) + per-vendor invoicing   | Compliant invoices + TCS reports         |
| Day 35-37 | Email/SMS/WhatsApp templates + legal pages      | All comms + legal pages live             |

**🏁 Milestone: Full marketplace experience - browse, search, buy, track, review, return, compliant invoicing.**

### Phase 4: Polish, Hardening & Launch (Est. 12-15 Days)

| **Day**   | **Tasks**                                       | **Deliverables**                     |
| --------- | ----------------------------------------------- | ------------------------------------ |
| Day 38-41 | Notifications, comparison, bulk upload/export   | Notification bell, compare, CSV I/O  |
| Day 40-43 | Support panel + live chat, seller score         | Ticketing + chat + vendor scoring    |
| Day 42-44 | Fraud engine, referral, abandoned-cart recovery | Risk flags + growth features         |
| Day 43-46 | Observability, backups/DR, SEO, performance     | Sentry, backups, Lighthouse > 85     |
| Day 45-50 | Automated tests (unit/E2E) + full QA + fixes    | Green test suite, all flows verified |
| Day 50-52 | Final build, staging UAT, production deploy     | Deployed, monitored, live            |

**🏁 Milestone: Production-ready, secured, compliant, tested, monitored, deployed.**

# 8\. Summary Timeline

| **Phase**                 | **Duration** | **Start** | **End** | **Key Milestone**                          |
| ------------------------- | ------------ | --------- | ------- | ------------------------------------------ |
| Phase 1 - Foundation      | 9-11 days    | Day 1     | Day 11  | Brand + DB + hardened auth + search + seed |
| Phase 2 - Core Engine     | 14-16 days   | Day 12    | Day 26  | Vendor → order → ship → payout → reconcile |
| Phase 3 - Features        | 11-13 days   | Day 27    | Day 37  | Full marketplace + compliant invoicing     |
| Phase 4 - Polish & Launch | 12-15 days   | Day 38    | Day 52  | Security, tests, monitoring, deploy        |

**Total: 46-55 working days • Approximately 9-11 weeks (single developer, full-time).**

## 7.3 Realistic Effort Note

The original v1.0 estimate of 26-32 days assumed a single developer delivering 75+ features. For a Flipkart-style marketplace with payments, shipping, tax compliance, and security done properly, that is not realistic. The revised 46-55 day single-developer estimate is honest but still aggressive. Recommended options:

- **Team route:** Add a second developer (split frontend / backend) to compress to ~6-7 weeks.
- **Phased route:** Ship a focused MVP first - P0 features only (core vendor→order→payout→ship + compliance) in ~5-6 weeks, then P1/P2 in follow-up sprints.
- **Scope route:** Treat P2 features (referral, comparison, live chat, bulk upload) as post-launch fast-follows.

# 9\. Risk Analysis

| **Risk**                                 | **Impact** | **Probability** | **Mitigation**                                                          |
| ---------------------------------------- | ---------- | --------------- | ----------------------------------------------------------------------- |
| Timeline vs single-developer capacity    | High       | High            | Revised estimate, MVP-first phasing, or add a developer (see 7.3)       |
| GST / TCS non-compliance (legal)         | High       | Medium          | Build TCS + per-vendor invoicing in Phase 3; consult a CA before launch |
| Vendor KYC fraud / fake sellers          | High       | Medium          | GSTIN+PAN+bank penny-drop verify, manual review, suspend controls       |
| Order splitting logic complexity         | High       | Medium          | Extensive unit testing, idempotent split, staged rollout                |
| Payment ↔ payout reconciliation mismatch | High       | Medium          | Reconciliation ledger, idempotency keys, webhook signature verify       |
| Overselling / stock race conditions      | High       | Medium          | Atomic stock decrement, reservation-on-checkout, DB-level guards        |
| Razorpay split-settlement complexity     | High       | Medium          | Use Razorpay Route; fallback = full capture + manual batch payout       |
| Shipping API failures / downtime         | Medium     | Medium          | Retry with backoff, circuit breaker, manual AWB fallback                |
| Search performance at scale              | Medium     | Medium          | Atlas Search + indexing instead of regex; cache popular queries         |
| Security breach / data leak              | High       | Low             | OWASP controls, rate limiting, secret hygiene, audit log, Sentry alerts |
| MongoDB performance (38+ models)         | Medium     | Low             | Indexing, connection pooling, Redis cache, query optimization           |
| UI redesign scope creep                  | Medium     | High            | Strict Flipkart-reference design, no custom exploration                 |
| Seed/data migration failures             | Low        | Medium          | Idempotent seed, error handling, incremental seeding                    |

# 10\. Testing & QA Strategy

v1.0 relied on manual testing only. v2.0 adds an automated safety net plus CI gating so regressions are caught before deploy.

| **Test Type**      | **Scope**                                                    | **Tool / Method**                    |
| ------------------ | ------------------------------------------------------------ | ------------------------------------ |
| Build Verification | TypeScript compilation, production build                     | npm run build (CI-gated)             |
| Unit Tests         | Commission, order-split, tax/TCS, wallet ledger, stock logic | Vitest (≥70% on core engines)        |
| Integration Tests  | API routes with valid/invalid data, auth & RBAC              | Vitest + supertest, test DB          |
| E2E Tests          | Vendor lifecycle, multi-vendor checkout, return/refund       | Playwright                           |
| Auth Flow          | Login/logout 5 roles, OTP, role-based redirects              | Automated + manual                   |
| Payment & Webhook  | Capture, refund, payout, signature verification, idempotency | Razorpay test mode + mocked webhooks |
| Order Flow         | Cart → checkout → split → ship → track → deliver → return    | E2E + manual                         |
| Responsive UI      | Mobile (320px), Tablet (768px), Desktop (1440px)             | Playwright viewports + DevTools      |
| Cross-Browser      | Chrome, Firefox, Safari, Edge                                | Playwright / manual                  |
| Load / Stress      | Catalog, search, checkout under concurrent load              | k6 (smoke load before launch)        |
| Security           | Dependency scan, secret scan, basic pen-test of auth/payment | npm audit, OWASP checklist           |
| Performance        | Lighthouse: Performance, SEO, Accessibility, Best Practices  | Lighthouse CI (target > 85)          |

CI/CD: GitHub Actions runs lint + typecheck + unit/integration + build on every PR; preview deploy per branch (Vercel); staging UAT before production promotion.

# 11\. Assumptions & Dependencies

## Assumptions

- MongoDB Atlas cluster remains available (only DB name changes); Atlas Search tier enabled.
- Razorpay account supports Route (split settlements) or manual payout fallback is acceptable for launch.
- Vercel Blob storage quota is sufficient for product images + vendor KYC documents.
- SMTP (Gmail) continues to work for transactional emails; SMS/WhatsApp provider accounts provisioned.
- No native mobile app required - responsive PWA web app only.
- No multi-language / multi-currency support in Phase 1 (INR only).
- A qualified CA / legal advisor confirms GST, TCS, and policy obligations before go-live.
- Timeline assumes a single full-time developer; estimate is aggressive (see 7.3 for team/MVP options).

## Dependencies

| **Service**                              | **Purpose**                           |
| ---------------------------------------- | ------------------------------------- |
| MongoDB Atlas (+ Atlas Search)           | Database hosting + full-text search   |
| Vercel                                   | App hosting, blob storage, cron, edge |
| Upstash Redis                            | Caching, rate limiting, sessions      |
| QStash / job queue                       | Background / async processing         |
| Razorpay (+ Route)                       | Payments + split vendor settlements   |
| Shiprocket / Delhivery                   | Shipping, AWB, tracking               |
| MSG91 / Twilio                           | SMS + OTP                             |
| WhatsApp Business API (Interakt/Gupshup) | WhatsApp messaging                    |
| Cashfree / Razorpay KYC APIs             | GSTIN/PAN/bank verification           |
| Google Cloud                             | OAuth credentials                     |
| Gmail SMTP                               | Email delivery                        |
| Sentry + Vercel Analytics                | Monitoring, error tracking, analytics |

# 12\. Deliverables Checklist

| **#** | **Deliverable**                                                        | **Status** |
| ----- | ---------------------------------------------------------------------- | ---------- |
| 1     | Updated .env with new MongoDB collection + all integration credentials | Pending    |
| 2     | Complete brand rebrand (60+ files)                                     | Pending    |
| 3     | New theme/color palette (globals.css)                                  | Pending    |
| 4     | 38+ Mongoose data models                                               | Pending    |
| 5     | 5-role auth + OTP login + sub-admin RBAC                               | Pending    |
| 6     | 90+ API route handlers (rate-limited, validated)                       | Pending    |
| 7     | Flipkart-style public storefront + Atlas Search                        | Pending    |
| 8     | Super Admin dashboard (incl. reconciliation, TCS, fraud)               | Pending    |
| 9     | Vendor portal (full-featured + KYC + shipping)                         | Pending    |
| 10    | Delivery partner dashboard (+ COD/OTP)                                 | Pending    |
| 11    | Support agent panel (+ live chat)                                      | Pending    |
| 12    | Customer account (wallet ledger, notifications, compare, referral)     | Pending    |
| 13    | Order-split, commission, payout & reconciliation engines               | Pending    |
| 14    | Shipping integration + webhooks + refund engine                        | Pending    |
| 15    | GST/TCS engine + per-vendor compliant invoicing                        | Pending    |
| 16    | Background job queue + Redis caching                                   | Pending    |
| 17    | Security hardening (OWASP, rate limit, DPDP)                           | Pending    |
| 18    | Seed data script (100+ products, 50+ categories, 13+ users)            | Pending    |
| 19    | Email + SMS + WhatsApp templates (rebranded)                           | Pending    |
| 20    | Legal policy pages (5+ policies, grievance officer)                    | Pending    |
| 21    | Automated test suite + CI pipeline                                     | Pending    |
| 22    | Observability (Sentry, logs, health, backups)                          | Pending    |
| 23    | Production build passing + staging UAT                                 | Pending    |
| 24    | Testing & verification complete                                        | Pending    |

# 13\. Approval

| **Role**           | **Name** | **Signature** | **Date** |
| ------------------ | -------- | ------------- | -------- |
| Project Manager    |          |               |          |
| Technical Lead     |          |               |          |
| Client/Stakeholder |          |               |          |

_This document is a living reference and will be updated as the project progresses through each phase._