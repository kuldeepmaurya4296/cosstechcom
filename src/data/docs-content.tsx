import React from "react";
import {
  BookOpen,
  Settings,
  ShoppingBag,
  LayoutDashboard,
  Terminal,
  Users,
  ArrowRight,
  Shield,
  CreditCard,
  Percent,
  Truck,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Coins,
} from "lucide-react";

export interface DocSection {
  id: string;
  title: string;
  icon: any;
  category:
    | "getting-started"
    | "customer-guide"
    | "admin-guide"
    | "technical-reference"
    | "future-roadmap";
  description: string;
  content: React.ReactNode;
}

export const docsSections: DocSection[] = [
  {
    id: "introduction",
    title: "Introduction & Overview",
    icon: BookOpen,
    category: "getting-started",
    description:
      "Learn about the brand story, core vision, and technology stack of Raja Boot House.",
    content: (
      <div className="space-y-6">
        <div className="border-b border-border/80 pb-4">
          <h1 className="font-serif text-3xl font-bold text-charcoal dark:text-cream">
            Introduction & Brand Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Official platform manual and developer-operator documentation guide.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            The Raja Boot House Story
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Established in <strong>2025</strong> by <strong>Bipin Gupta</strong> and co-founder{" "}
            <strong>Prince Gupta</strong>, Raja Boot House is a premium retail footwear brand. It
            carries a comprehensive catalog spanning daily slippers, formal leather shoes, sports
            trainers, ethnic sandals, and dulha-dulhan (wedding/bridal) selections. The platform
            serves all demographics (Men, Women, and Children), offering a premium digital shopping
            experience.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            Business Model
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Raja Boot House operates as a direct-to-consumer (B2C) e-commerce portal, bridging local
            craftsmanship with digital convenience. Originally built as a single-vendor retail
            outlet managed directly by Bipin Gupta, the platform is architected to scale into a
            multi-vendor logistics hub, hosting third-party footwear brands and managing split
            settlements.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            Core Technology Stack
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-2">
            {[
              {
                title: "Next.js 14 (App Router)",
                desc: "Utilizes React Server Components (RSC) for instantaneous page loads and Incremental Static Regeneration (ISR 60s) for high-performance storefront scaling.",
              },
              {
                title: "MongoDB Atlas & Mongoose",
                desc: "A flexible document store mapped with strict validation schemas. Implements database connection pooling and Atlas Search indexation.",
              },
              {
                title: "Razorpay Checkout & Webhooks",
                desc: "Secure transaction processing supporting cards, wallets, net banking, UPI, and Cash on Delivery (COD) order management.",
              },
              {
                title: "Tailwind CSS v4 & Lucide",
                desc: "A premium design system built with custom theme variables (--color-oxblood, --color-cognac, --color-cream) for modern aesthetics.",
              },
              {
                title: "Redux Toolkit & RTK Query",
                desc: "Global client-side cart synchronization, modal management, and caching layers.",
              },
              {
                title: "PWA Service Workers",
                desc: "Progressive Web App support using next-pwa for offline fallback access, precached assets, and install prompts.",
              },
            ].map((tech, idx) => (
              <div
                key={idx}
                className="p-4 bg-muted/20 border border-border/40 rounded-2xl flex flex-col justify-between"
              >
                <span className="font-serif font-bold text-sm text-cognac dark:text-brass">
                  {tech.title}
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{tech.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    ),
  },
  {
    id: "platform-features",
    title: "Platform Features & PWA",
    icon: Shield,
    category: "getting-started",
    description: "Security, session management, Google OAuth, PWAs, and SEO indexing details.",
    content: (
      <div className="space-y-6">
        <div className="border-b border-border/80 pb-4">
          <h1 className="font-serif text-3xl font-bold text-charcoal dark:text-cream">
            Platform Features & PWA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Underlying architecture, security frameworks, and PWA capabilities.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            1. Session & Role Management
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The platform implements stateless, secure session management powered by{" "}
            <strong>NextAuth.js</strong>. Sessions are signed using `JWT` keys and stored in
            `httpOnly` secure cookies.
          </p>
          <div className="overflow-x-auto border border-border/50 rounded-2xl bg-card">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
                  <th className="p-3">User Role</th>
                  <th className="p-3">Authentication Provider</th>
                  <th className="p-3">Capabilities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted-foreground">
                <tr>
                  <td className="p-3 font-semibold text-charcoal dark:text-cream">Guest</td>
                  <td className="p-3">Anonymous</td>
                  <td className="p-3">Browse PLP/PDP, add to cart (stored locally), search.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-charcoal dark:text-cream">Customer</td>
                  <td className="p-3">Google OAuth / Email (Bcrypt)</td>
                  <td className="p-3">
                    DB-synced cart, checkout, profile address book, order history, review
                    submission.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-charcoal dark:text-cream">Vendor</td>
                  <td className="p-3">Credentials Panel</td>
                  <td className="p-3">
                    Create/manage own product inventory, track supplier revenue.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-charcoal dark:text-cream">Admin</td>
                  <td className="p-3">Credentials Panel (Bipin Gupta)</td>
                  <td className="p-3">
                    Full system control, financial logs, global settings, logistics staff, CMS,
                    review moderation.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            2. Google OAuth & Account Linking
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When users log in using Google OAuth, NextAuth hooks automatically verify their email.
            If a credentials-based profile exists under that email, the system safely links the
            Google OAuth ID to the account, preventing duplicate users and preserving customer order
            history.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            3. Progressive Web App (PWA)
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The platform contains full PWA integration utilizing `manifest.json` and service worker
            registrations via `next-pwa` and Workbox:
          </p>
          <ul className="list-disc list-inside text-xs text-muted-foreground leading-relaxed space-y-1.5 pl-2">
            <li>
              <strong>Manifest Config</strong>: Custom icon sets (192x192, 512x512 PNGs), theme
              colors (`#1E3A5F`), standalone displays.
            </li>
            <li>
              <strong>Service Worker Cache-First</strong>: Static JS/CSS assets and Cloudinary
              product photos are cached for fast offline catalog browsing.
            </li>
            <li>
              <strong>Service Worker Stale-While-Revalidate</strong>: Product metadata and searches
              are fetched over the network but served from cache instantly on connection drops.
            </li>
            <li>
              <strong>Install Banner</strong>: Dynamic custom "Add to Home Screen" notification
              prompts appear when browse criteria are met.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            4. SEO Strategy & Structured Schemas
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every page implements dynamic, unique SEO optimizations using the Next.js
            `generateMetadata` API, pre-rendering OpenGraph social cards, and sitemaps. The system
            renders <strong>JSON-LD schemas</strong>:
          </p>
          <ul className="list-disc list-inside text-xs text-muted-foreground leading-relaxed space-y-1.5 pl-2">
            <li>
              <strong>Organization Schema</strong>: Renders on the homepage defining brand logo,
              URL, founders, and customer support.
            </li>
            <li>
              <strong>Product Schema</strong>: Renders on PDPs carrying product name, images,
              average ratings, reviews, stock availability, price, and currency.
            </li>
            <li>
              <strong>BreadcrumbList Schema</strong>: Renders catalog hierarchies (e.g. Shop &gt;
              Category &gt; Product) for search snippets.
            </li>
            <li>
              <strong>FAQPage Schema</strong>: Automatically populated from global store FAQs on
              support pages.
            </li>
          </ul>
        </section>
      </div>
    ),
  },
  {
    id: "customer-checkout",
    title: "Customer Shop & Checkout Portal",
    icon: ShoppingBag,
    category: "customer-guide",
    description: "How catalog filtering, PDP variants, coupon checking, and Razorpay splits work.",
    content: (
      <div className="space-y-6">
        <div className="border-b border-border/80 pb-4">
          <h1 className="font-serif text-3xl font-bold text-charcoal dark:text-cream">
            Customer Shop & Checkout Portal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            E-commerce front-end and checkout engine validations.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            1. Catalog Browsing & PDP Variants
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Product Listing Page (PLP) features infinite scroll and faceted sidebars filtering
            by size, brand, price, color, and gender. The Product Detail Page (PDP) uses an
            interactive variant selector. Selecting a specific color variant swaps the gallery with
            color-specific Cloudinary images, and selecting a size checks the stock levels for that
            size in real-time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            2. Step-by-Step Checkout Pipeline
          </h2>
          <div className="space-y-4 mt-3">
            {[
              {
                step: "Step 1",
                title: "Shipping Address Details",
                details:
                  "Customers enter shipping coordinates. Zod schema applies validation rules. Full Name, Address, City, and State are required. PIN code (ZIP) must match the Indian 6-digit PIN regex ^\\d{6}$ (auto-populating city/state). Mobile phone number must match the Indian 10-digit mobile regex ^[6-9]\\d{9}$.",
              },
              {
                step: "Step 2",
                title: "Shipping Options & Coupon Validation",
                details:
                  "Choose from shipping methods defined in global settings. Apply coupon codes (flat, percentage, or free shipping). The checkout queries /api/coupons/validate with the cart subtotal, validating expiration dates, min-cart requirements, and maximum usage thresholds.",
              },
              {
                step: "Step 3",
                title: "Payment Selection & Gateway Checkout",
                details:
                  "Options are populated dynamically from settings: Cash on Delivery (COD) or Online. Accepting store policies is mandatory. If Pay Online is selected, Next.js triggers the Razorpay Checkout modal, loading the Razorpay SDK dynamically. Prefilled contact details are transmitted for a seamless payment experience.",
              },
            ].map((st, idx) => (
              <div
                key={idx}
                className="p-4 bg-muted/10 border border-border/30 rounded-2xl relative"
              >
                <span className="absolute top-3 right-4 font-serif font-extrabold text-[10px] text-cognac bg-cognac/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {st.step}
                </span>
                <h4 className="font-serif font-bold text-sm text-charcoal dark:text-cream mb-1">
                  {st.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{st.details}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            3. Razorpay Signature Verification & Safety Handlers
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When a customer pays, Razorpay returns a `payment_id`, `order_id`, and `signature`. The
            server-side route `/api/orders/verify-payment` verifies the signature using an
            HMAC-SHA256 hash containing:
          </p>
          <pre className="p-3 bg-charcoal text-cream text-[10px] font-mono rounded-xl overflow-x-auto leading-normal">
            crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            <br />
            &nbsp;&nbsp;.update(razorpay_order_id + "|" + razorpay_payment_id)
            <br />
            &nbsp;&nbsp;.digest("hex") === razorpay_signature;
          </pre>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong>Order Safety Rollbacks</strong>: If the user dismisses the payment modal midway
            or payment fails, an API handler cancels the order draft and immediately rolls back the
            reserved SKU stocks to prevent database inventory leaks.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            4. Customer Loyalty Points System
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The platform features a premium <strong>Customer Loyalty Points</strong> rewards system
            to incentivize repeated purchases:
          </p>
          <ul className="list-disc list-inside text-xs text-muted-foreground leading-relaxed space-y-1.5 pl-2">
            <li>
              <strong>Point Accumulation</strong>: Customers automatically earn{" "}
              <strong>5% of the total order value</strong> in points when their order status is
              transitioned to <code>DELIVERED</code>.
            </li>
            <li>
              <strong>Redemption System</strong>: At Checkout, if a customer has a points balance, a
              redemption panel appears. They can choose to redeem points (worth ₹1 each) which are
              immediately applied as a discount on their order total.
            </li>
            <li>
              <strong>Loyalty Dashboard</strong>: Under the customer account page, users can view
              their current tier, points transaction logs, rules, and tiers progress.
            </li>
            <li>
              <strong>Reversals</strong>: If an order is returned or refunded, points earned from
              that order are automatically deducted from their balance.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            5. Flash Sales Storefront Flow
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sellers can schedule high-visibility <strong>Flash Sales</strong> with direct
            count-downs:
          </p>
          <ul className="list-disc list-inside text-xs text-muted-foreground leading-relaxed space-y-1.5 pl-2">
            <li>
              <strong>Announcement Banner</strong>: When a flash sale is active, a red announcement
              banner ticks at the top of the store with a real-time countdown timer.
            </li>
            <li>
              <strong>Catalog Displays</strong>: Product cards display a flashing{" "}
              <code>⚡ FLASH DEAL</code> badge and display the discounted price highlighted.
            </li>
            <li>
              <strong>Product Details Countdown</strong>: The product page renders a dedicated
              countdown widget ticking down to the exact second of campaign expiration.
            </li>
            <li>
              <strong>Server Verification</strong>: To prevent customer cart tempering, checkout
              APIs cross-reference items with active database flash campaigns, verifying discount
              rates server-side.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            6. Recently Viewed, Sharing & Reviews
          </h2>
          <ul className="list-disc list-inside text-xs text-muted-foreground leading-relaxed space-y-1.5 pl-2">
            <li>
              <strong>Recently Viewed Products</strong>: Dynamically tracks viewed items locally,
              presenting a responsive carousel on catalog pages for easier navigation.
            </li>
            <li>
              <strong>Social Product Share</strong>: Integrates the native Web Share API (on mobile)
              or copies direct product URLs with custom clipboard notifications for easy sharing.
            </li>
            <li>
              <strong>Enhanced Reviews</strong>: Supports interactive star ratings, user image
              uploads, and lists rating summaries with percentage bars.
            </li>
          </ul>
        </section>
      </div>
    ),
  },
  {
    id: "admin-overview-cms",
    title: "Admin Dashboard: Overview & CMS",
    icon: LayoutDashboard,
    category: "admin-guide",
    description: "Fulfillment pipelines, metrics deltas, low-stock widgets, and the CMS dashboard.",
    content: (
      <div className="space-y-6">
        <div className="border-b border-border/80 pb-4">
          <h1 className="font-serif text-3xl font-bold text-charcoal dark:text-cream">
            Admin Dashboard: Overview & CMS
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Management interfaces and homepage CMS controls.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            1. Overview Metrics & WoW Deltas
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The main admin page aggregates key business statistics (total revenue, order volume,
            customers count, products count) and calculates week-over-week (WoW) percentage growth.
            It compares the current 7-day performance to the preceding 7-day period to display
            real-time progress indicators.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            2. Low Stock Alerts & Queues
          </h2>
          <ul className="list-disc list-inside text-xs text-muted-foreground leading-relaxed space-y-1.5 pl-2">
            <li>
              <strong>Low Stock Registry</strong>: A warning widget automatically scans variants. If
              any size/color SKU drops below <strong>5 items</strong>, it registers an alert with a
              quick "Refill" link to the inventory manager.
            </li>
            <li>
              <strong>Fulfillment Queues</strong>: Displays active orders grouped by state:{" "}
              <strong>Placed Queue</strong> (awaiting admin confirmation),{" "}
              <strong>Ready to Dispatch Queue</strong> (Confirmed and Packed), and{" "}
              <strong>In Transit Queue</strong> (Shipped or Out for Delivery).
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            3. Content Management System (CMS)
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The CMS panel contains seven dedicated tabs for controlling the homepage layout,
            branding, and policies:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {[
              {
                label: "Hero Banners",
                desc: "CRUD for banners, linking slides to collections, and setting order weights.",
              },
              {
                label: "Shop by Style (Categories)",
                desc: "Manage homepage categories grid and upload placeholder images.",
              },
              {
                label: "Authorized Brands",
                desc: "Control logos in the sliding marquee (Lakhani, Touch, Paragon, Goldstar).",
              },
              {
                label: "Trust Badges",
                desc: "Edit the four highlight cards (Free Shipping, Return window details, etc.) under the hero banner.",
              },
              {
                label: "Newsletter Blast",
                desc: "List email club subscribers and send bulk campaigns using Nodemailer/SMTP.",
              },
              {
                label: "Legal Policies",
                desc: "Rich-text editor to update Privacy, Terms, Delivery, and Return text.",
              },
              {
                label: "Global Settings",
                desc: "Configure store name, tax rates, return policy, and payment method toggles.",
              },
            ].map((tab, idx) => (
              <div key={idx} className="p-3.5 bg-muted/20 border border-border/40 rounded-xl">
                <span className="font-bold text-xs text-cognac dark:text-brass block">
                  {tab.label}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">{tab.desc}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            4. Flash Sales Scheduling & Management
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The administrator has a dedicated Flash Sales panel to configure campaigns:
          </p>
          <ul className="list-disc list-inside text-xs text-muted-foreground leading-relaxed space-y-1.5 pl-2">
            <li>
              <strong>Active Period</strong>: Define the start and end timestamp down to the minute.
            </li>
            <li>
              <strong>Discounts</strong>: Choose between flat deductions or percentage discount
              rates.
            </li>
            <li>
              <strong>Product Selection</strong>: Add/remove specific catalog products participating
              in the flash campaign.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            5. Admin Activity Logs & Notifications
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All operator events (order updates, CMS banner swaps, setting overrides) register audit
            logs:
          </p>
          <ul className="list-disc list-inside text-xs text-muted-foreground leading-relaxed space-y-1.5 pl-2">
            <li>
              <strong>Activity Ledger</strong>: Logs action type, date, and user details (IP/name).
            </li>
            <li>
              <strong>Real-Time Notification Bell</strong>: A notification menu alerts operators of
              new review submissions, low stock, and return requests.
            </li>
          </ul>
        </section>
      </div>
    ),
  },
  {
    id: "admin-operations",
    title: "Admin Operations & Fulfillment",
    icon: Truck,
    category: "admin-guide",
    description: "Order transitions, delivery riders, courier integrations, and return settings.",
    content: (
      <div className="space-y-6">
        <div className="border-b border-border/80 pb-4">
          <h1 className="font-serif text-3xl font-bold text-charcoal dark:text-cream">
            Admin Operations & Fulfillment
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lifecycle transition rules, logistics, and returns control.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            1. Order Fulfillment Pipeline
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Orders progress through strict lifecycle transitions. Unauthorized overrides are
            prevented by backend guard checks:
          </p>
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 p-4 bg-muted/15 border border-border/30 rounded-2xl text-[10px] font-bold tracking-wider text-muted-foreground">
            <span className="bg-cognac/10 text-cognac px-2 py-1 rounded">PLACED</span>
            <ArrowRight className="h-4 w-4 hidden md:block text-muted-foreground/60" />
            <span className="bg-primary/10 text-primary px-2 py-1 rounded">CONFIRMED</span>
            <ArrowRight className="h-4 w-4 hidden md:block text-muted-foreground/60" />
            <span className="bg-brass/10 text-brass px-2 py-1 rounded">PACKED</span>
            <ArrowRight className="h-4 w-4 hidden md:block text-muted-foreground/60" />
            <span className="bg-secondary/40 text-secondary-foreground px-2 py-1 rounded">
              SHIPPED
            </span>
            <ArrowRight className="h-4 w-4 hidden md:block text-muted-foreground/60" />
            <span className="bg-charcoal text-cream px-2 py-1 rounded">DELIVERED</span>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            2. Logistics & Delivery Assignment
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When marking an order as <strong>SHIPPED</strong>, the administrator configures the
            logistics type:
          </p>
          <ul className="list-disc list-inside text-xs text-muted-foreground leading-relaxed space-y-1.5 pl-2">
            <li>
              <strong>Self Delivery (Rider)</strong>: Assigns a delivery staff member registered in
              the database (e.g. self-riders). The system fetches and links their mobile number for
              customer alerts.
            </li>
            <li>
              <strong>Third-Party Courier</strong>: Selects courier networks (Delhivery, Shiprocket,
              Blue Dart) and requires an AWB Tracking ID. The public UI uses this to generate
              tracking link templates (e.g., `https://shiprocket.co/tracking/{"{{AWB}}"}`).
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            3. Cash on Delivery (COD) Payment Verification
          </h2>
          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs text-amber-800">Critical Payment Guard Check</h4>
              <p className="text-xs text-amber-700 leading-relaxed mt-1">
                For Cash on Delivery (COD) orders, when transitioning the status to{" "}
                <strong>DELIVERED</strong>, the admin interface displays a mandatory checkbox:{" "}
                <em>"I confirm that the cash payment of [amount] has been collected."</em> Without
                checking this, the status update remains locked to ensure strict cash audit logs.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            4. Returns & Refunds Lifecycle
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If a customer requests a return (allowed within a return window defined in settings),
            the admin moderates it:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-2">
            <div className="p-4 bg-muted/20 border border-border/40 rounded-xl">
              <span className="font-bold text-xs text-charcoal dark:text-cream block">
                Return Approvals
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Transition to `RETURN_APPROVED` (awaiting pickup). When the product is returned,
                status becomes `RETURNED` (Marking stock returned to inventory).
              </p>
            </div>
            <div className="p-4 bg-muted/20 border border-border/40 rounded-xl">
              <span className="font-bold text-xs text-charcoal dark:text-cream block">
                Refund Processing
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Transition to `REFUNDED` requires assigning the refund method (`ONLINE` via Razorpay
                or `CASH`/Offline) and registering a refund transaction ID.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            5. Invoice PDF Generation & Download
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The platform automatically generates professional digital invoices for orders:
          </p>
          <ul className="list-disc list-inside text-xs text-muted-foreground leading-relaxed space-y-1.5 pl-2">
            <li>
              <strong>Itemized Details</strong>: Breaks down product descriptions, variants (size,
              color), individual pricing, and item quantities.
            </li>
            <li>
              <strong>Taxation and Deductions</strong>: Clearly details CGST/SGST/IGST calculations
              and displays adjustments for coupons and Loyalty Points.
            </li>
            <li>
              <strong>Operator and Customer Access</strong>: Invoices can be downloaded as PDF
              documents directly from the user order history page or the admin orders desk.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            6. Bulk Inventory Import (CSV)
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To scale catalog updates, administrators can perform bulk product imports:
          </p>
          <ul className="list-disc list-inside text-xs text-muted-foreground leading-relaxed space-y-1.5 pl-2">
            <li>
              <strong>CSV Templates</strong>: Upload files matching standard headers (Name, Slug,
              Description, Price, SKU, Color, Size, Stock, Brand, Category, Images).
            </li>
            <li>
              <strong>Automatic Mapping</strong>: Creates new product documents and registers
              complex color/size variants in the DB from flat CSV rows.
            </li>
            <li>
              <strong>Error Validation</strong>: Validates slugs, SKUs, and required fields before
              making database inserts to guarantee ledger integrity.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            7. WhatsApp Order Notification & Help Desk
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Direct instant messaging capabilities are integrated:
          </p>
          <ul className="list-disc list-inside text-xs text-muted-foreground leading-relaxed space-y-1.5 pl-2">
            <li>
              <strong>WhatsApp Support Button</strong>: Storefront contains a floating green
              WhatsApp button pre-filling text to connect shoppers with customer agents immediately.
            </li>
            <li>
              <strong>Logistics Triggers</strong>: In order dashboards, admins can click quick links
              to trigger manual status message templates to customer contact numbers for shipping
              updates.
            </li>
          </ul>
        </section>
      </div>
    ),
  },
  {
    id: "admin-analytics",
    title: "Admin Analytics, Reports & Vendors",
    icon: TrendingUp,
    category: "admin-guide",
    description:
      "Visual P&L calculations, COGS (60%), platform fees, CSV export logs, and vendors.",
    content: (
      <div className="space-y-6">
        <div className="border-b border-border/80 pb-4">
          <h1 className="font-serif text-3xl font-bold text-charcoal dark:text-cream">
            Admin Analytics, Reports & Vendors
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Business health visualization, financial statements, and supplier tracking.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            1. SVG Daily Sales Chart
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The analytics view features custom, lightweight **SVG Area Charts** tracking daily
            revenue and orders. It calculates coordinates dynamically and maps a smooth
            conic-gradient donut chart for payment method distribution (UPI vs Card vs Net Banking
            vs COD).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            2. Financial P&L Statement Engine
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The **Financials Tab** renders a detailed profit-and-loss sheet calculated using
            standard marketplace margins:
          </p>
          <ul className="list-disc list-inside text-xs text-muted-foreground leading-relaxed space-y-1.5 pl-2">
            <li>
              <strong>Gross Sales</strong>: Subtotal + shipping fees collected.
            </li>
            <li>
              <strong>Deductions</strong>: Coupon discounts, cancellations, and refunded returns
              values.
            </li>
            <li>
              <strong>Net Sales</strong>: Gross Sales minus Deductions.
            </li>
            <li>
              <strong>COGS (Cost of Goods Sold)</strong>: Automatically calculated at{" "}
              <strong>60% of purchase price</strong> on completed orders.
            </li>
            <li>
              <strong>Gateway fees</strong>: Calculated at <strong>2% of online Net Sales</strong>{" "}
              (excludes Cash on Delivery).
            </li>
            <li>
              <strong>Net Profit</strong>: Net Sales - COGS - gateway fees. Margins are displayed as
              percentages.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            3. Bulk Orders Export (Excel/CSV) & Data Logs
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The admin orders dashboard features a one-click <strong>Export to CSV</strong> button to
            generate structured data backups:
          </p>
          <ul className="list-disc list-inside text-xs text-muted-foreground leading-relaxed space-y-1.5 pl-2">
            <li>
              <strong>Export Filters</strong>: Operators can export either the entire database
              ledger or just the currently filtered list of orders (e.g. by status, date range, or
              seller).
            </li>
            <li>
              <strong>Comprehensive Ledger mapping</strong>: Output includes customer names, emails,
              phones, shipping addresses, payment status, transaction codes, items purchased
              (quantities, variants), and totals.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            4. Vendor Management & Split Revenue
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The vendor panel tracks accounts with the user `role: "vendor"`. It monitors the total
            count of products listed by each seller, calculates their revenue shares, and lists
            their joined dates.
          </p>
        </section>
      </div>
    ),
  },
  {
    id: "technical-reference",
    title: "Technical Reference & Schemas",
    icon: Terminal,
    category: "technical-reference",
    description: "Database collections details, Mongoose model definitions, and API route mapping.",
    content: (
      <div className="space-y-6">
        <div className="border-b border-border/80 pb-4">
          <h1 className="font-serif text-3xl font-bold text-charcoal dark:text-cream">
            Technical Reference & Schemas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Database models, schemas, background crons, and API listings.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            1. Database Mongoose Schemas
          </h2>
          <div className="space-y-4">
            <div>
              <span className="font-bold text-xs text-cognac dark:text-brass block font-mono">
                Product Schema
              </span>
              <pre className="p-3 bg-charcoal text-cream text-[10px] font-mono rounded-xl overflow-x-auto leading-normal">
                {"{"}
                <br />
                &nbsp;&nbsp;name: String, slug: String, description: String, price: Number,
                <br />
                &nbsp;&nbsp;salePrice: Number, category: ObjectId (ref Category), brand: ObjectId
                (ref Brand),
                <br />
                &nbsp;&nbsp;gender: enum["Men","Women","Children","Unisex"], occasion: [String],
                <br />
                &nbsp;&nbsp;images: [{"{ url: String, public_id: String }"}],
                <br />
                &nbsp;&nbsp;variants: [
                {
                  "{ size: Number, color: String, colorHex: String, stock: Number, sku: String, images: [...] }"
                }
                ],
                <br />
                &nbsp;&nbsp;rating: {"{ average: Number, count: Number }"}, isFeatured: Boolean,
                isNewArrival: Boolean,
                <br />
                &nbsp;&nbsp;isActive: Boolean, returnDays: Number
                <br />
                {"}"}
              </pre>
            </div>

            <div>
              <span className="font-bold text-xs text-cognac dark:text-brass block font-mono">
                Order Schema
              </span>
              <pre className="p-3 bg-charcoal text-cream text-[10px] font-mono rounded-xl overflow-x-auto leading-normal">
                {"{"}
                <br />
                &nbsp;&nbsp;orderId: String, userId: ObjectId (ref User),
                <br />
                &nbsp;&nbsp;items: [
                {
                  "{ productId: ObjectId, name: String, size: Number, color: String, price: Number, qty: Number }"
                }
                ],
                <br />
                &nbsp;&nbsp;shippingAddress:{" "}
                {"{ fullName: String, phone: String, line1: String, city: String, pin: String }"},
                <br />
                &nbsp;&nbsp;pricing:{" "}
                {"{ subtotal: Number, shipping: Number, couponDiscount: Number, total: Number }"},
                <br />
                &nbsp;&nbsp;payment:{" "}
                {
                  "{ method: String, status: enum[PENDING, PAID, FAILED, REFUNDED], razorpayOrderId: String, razorpayPaymentId: String }"
                }
                ,<br />
                &nbsp;&nbsp;status: enum[PLACED, CONFIRMED, PACKED, SHIPPED, OUT_FOR_DELIVERY,
                DELIVERED, CANCELLED, RETURNED],
                <br />
                &nbsp;&nbsp;statusHistory: [{"{ status: String, timestamp: Date, note: String }"}],
                <br />
                &nbsp;&nbsp;shipping:{" "}
                {"{ courier: String, trackingNumber: String, deliveryMethod: String }"},<br />
                &nbsp;&nbsp;refundDetails:{" "}
                {"{ preference: String, upiId: String, method: String, transactionId: String }"}
                <br />
                {"}"}
              </pre>
            </div>

            <div>
              <span className="font-bold text-xs text-cognac dark:text-brass block font-mono">
                LoyaltyPoints Schema
              </span>
              <pre className="p-3 bg-charcoal text-cream text-[10px] font-mono rounded-xl overflow-x-auto leading-normal">
                {"{"}
                <br />
                &nbsp;&nbsp;userId: ObjectId (ref User),
                <br />
                &nbsp;&nbsp;points: Number (positive for earned, negative for redeemed),
                <br />
                &nbsp;&nbsp;type: enum["EARNED", "REDEEMED"],
                <br />
                &nbsp;&nbsp;orderId: ObjectId (ref Order),
                <br />
                &nbsp;&nbsp;description: String
                <br />
                {"}"}
              </pre>
            </div>

            <div>
              <span className="font-bold text-xs text-cognac dark:text-brass block font-mono">
                FlashSale Schema
              </span>
              <pre className="p-3 bg-charcoal text-cream text-[10px] font-mono rounded-xl overflow-x-auto leading-normal">
                {"{"}
                <br />
                &nbsp;&nbsp;name: String,
                <br />
                &nbsp;&nbsp;discountType: enum["FLAT", "PERCENTAGE"],
                <br />
                &nbsp;&nbsp;discountValue: Number,
                <br />
                &nbsp;&nbsp;startDate: Date,
                <br />
                &nbsp;&nbsp;endDate: Date,
                <br />
                &nbsp;&nbsp;productIds: [ObjectId (ref Product)],
                <br />
                &nbsp;&nbsp;isActive: Boolean
                <br />
                {"}"}
              </pre>
            </div>

            <div>
              <span className="font-bold text-xs text-cognac dark:text-brass block font-mono">
                Cart Schema (Abandoned Recovery)
              </span>
              <pre className="p-3 bg-charcoal text-cream text-[10px] font-mono rounded-xl overflow-x-auto leading-normal">
                {"{"}
                <br />
                &nbsp;&nbsp;userId: ObjectId (ref User),
                <br />
                &nbsp;&nbsp;items: [{"{"}
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;productId: ObjectId, name: String, size: Number, color:
                String, price: Number, quantity: Number, image: String, slug: String
                <br />
                &nbsp;&nbsp;{"}"}],
                <br />
                &nbsp;&nbsp;emailSent: Boolean,
                <br />
                &nbsp;&nbsp;updatedAt: Date
                <br />
                {"}"}
              </pre>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            2. Background Cleanup Tasks & Calculations
          </h2>
          <ul className="list-disc list-inside text-xs text-muted-foreground leading-relaxed space-y-1.5 pl-2">
            <li>
              <strong>Order Expire Task (`cleanupExpiredPendingOrders`)</strong>: Scans orders
              marked `PENDING` payment. If an online order has been pending for over 30 minutes, it
              automatically cancels the order, sets payment to `FAILED`, and restores the reserved
              stocks atomically using a Mongoose `$inc` query.
            </li>
            <li>
              <strong>User Bias Deduplication (`updateProductRating`)</strong>: Recalculates product
              reviews. To prevent user rating manipulation, it groups reviews by `userId` and only
              counts the review with the highest rating for each user.
            </li>
            <li>
              <strong>Abandoned Cart Recovery Cron (`/api/cron/abandoned-cart`)</strong>: Scans
              database for customer shopping carts that have been inactive for more than 45 minutes
              but less than 24 hours. If an email has not yet been sent (
              <code>emailSent === false</code>), it automatically dispatches a premium styled email
              displaying the items and a direct checkout link, then marks{" "}
              <code>emailSent = true</code>.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            3. API Router Map
          </h2>
          <div className="overflow-x-auto border border-border/50 rounded-2xl bg-card">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
                  <th className="p-3">Method</th>
                  <th className="p-3">Route</th>
                  <th className="p-3">Module Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted-foreground">
                <tr>
                  <td className="p-3 font-semibold text-emerald-700 bg-emerald-50 dark:bg-transparent">
                    GET
                  </td>
                  <td className="p-3 font-mono">/api/products</td>
                  <td className="p-3">Retrieve active catalog with filter parameters.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-blue-700 bg-blue-50 dark:bg-transparent">
                    POST
                  </td>
                  <td className="p-3 font-mono">/api/coupons/validate</td>
                  <td className="p-3">Validates coupon eligibility against cart value.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-blue-700 bg-blue-50 dark:bg-transparent">
                    POST
                  </td>
                  <td className="p-3 font-mono">/api/orders</td>
                  <td className="p-3">
                    Create pending customer order and hold product variant stock.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-orange-700 bg-orange-50 dark:bg-transparent">
                    PUT
                  </td>
                  <td className="p-3 font-mono">/api/orders</td>
                  <td className="p-3">
                    Admin updates order lifecycle status (Riders, AWB, COD validations).
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-blue-700 bg-blue-50 dark:bg-transparent">
                    POST
                  </td>
                  <td className="p-3 font-mono">/api/webhooks/razorpay</td>
                  <td className="p-3">
                    Razorpay background payment verification and confirmation.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-emerald-700 bg-emerald-50 dark:bg-transparent">
                    GET
                  </td>
                  <td className="p-3 font-mono">/api/admin/dashboard</td>
                  <td className="p-3">Dashboard metrics, WoW deltas, low stock warnings.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-emerald-700 bg-emerald-50 dark:bg-transparent">
                    GET
                  </td>
                  <td className="p-3 font-mono">/api/user/loyalty</td>
                  <td className="p-3">Retrieve customer's loyalty points balance and ledger.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-blue-700 bg-blue-50 dark:bg-transparent">
                    POST
                  </td>
                  <td className="p-3 font-mono">/api/user/cart</td>
                  <td className="p-3">Sync local storage cart items with the database.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-emerald-700 bg-emerald-50 dark:bg-transparent">
                    GET
                  </td>
                  <td className="p-3 font-mono">/api/flash-sales</td>
                  <td className="p-3">
                    Retrieve active storefront flash sales and countdown values.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-blue-700 bg-blue-50 dark:bg-transparent">
                    POST
                  </td>
                  <td className="p-3 font-mono">/api/admin/flash-sales</td>
                  <td className="p-3">Create a scheduled flash sale event (Admin only).</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-emerald-700 bg-emerald-50 dark:bg-transparent">
                    GET
                  </td>
                  <td className="p-3 font-mono">/api/cron/abandoned-cart</td>
                  <td className="p-3">
                    Trigger abandoned cart recovery check and Nodemailer email dispatches.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-emerald-700 bg-emerald-50 dark:bg-transparent">
                    GET
                  </td>
                  <td className="p-3 font-mono">/api/admin/activity-log</td>
                  <td className="p-3">Retrieve admin activity and CMS operations history log.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-blue-700 bg-blue-50 dark:bg-transparent">
                    POST
                  </td>
                  <td className="p-3 font-mono">/api/admin/products/import</td>
                  <td className="p-3">
                    Import bulk products and variant inventories from CSV file uploads.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-emerald-700 bg-emerald-50 dark:bg-transparent">
                    GET
                  </td>
                  <td className="p-3 font-mono">/api/admin/orders/export</td>
                  <td className="p-3">
                    Export order history ledger to downloadable CSV file format.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    ),
  },
  {
    id: "future-roadmap",
    title: "Future Multi-Vendor Roadmap",
    icon: Coins,
    category: "future-roadmap",
    description:
      "Blueprint for vendor onboarding, split checkouts, and Razorpay Route commission splits.",
    content: (
      <div className="space-y-6">
        <div className="border-b border-border/80 pb-4">
          <h1 className="font-serif text-3xl font-bold text-charcoal dark:text-cream">
            Future Multi-Vendor Roadmap
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Strategy and technical architecture for multi-vendor transition.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            1. Vendor Onboarding & linked Accounts
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sellers register via a dedicated onboarding portal. Upon completing KYC verification,
            the system registers the seller as a <strong>Linked Account</strong> in the Razorpay
            Marketplace ecosystem, saving the returned `razorpayAccountId` in the user's document
            details.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            2. Split Cart Order Routing
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When a checkout contains products from different vendors:
          </p>
          <ul className="list-disc list-inside text-xs text-muted-foreground leading-relaxed space-y-1.5 pl-2">
            <li>The platform generates a single parent `Order` ID for payment processing.</li>
            <li>
              Behind the scenes, the database generates individual `SubOrders` associated with each
              vendor.
            </li>
            <li>
              Suborders maintain their own fulfillment logs (Packed, Shipped, AWB entries), allowing
              vendors to dispatch their goods independently.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            3. Automated Settlements via Razorpay Route
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To automate splits and platform payouts, we will integrate{" "}
            <strong>Razorpay Route</strong>. Upon verifying payment capture:
          </p>
          <div className="p-4 bg-muted/20 border border-border/40 rounded-xl space-y-2">
            <span className="text-xs font-bold text-primary block">Transfer Dispatch Logic</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Platform fees/commissions are retained, and the net payout is routed:
            </p>
            <pre className="p-3 bg-charcoal text-cream text-[10px] font-mono rounded-lg overflow-x-auto leading-normal">
              Vendor Payout = Item Price - Platform Category Commission - Shipping Cost Split
            </pre>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-charcoal dark:text-cream">
            4. Held Payouts & Return Shield
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To prevent vendor account balance deficits due to customer returns, Razorpay Route
            transfers will be created with `"on_hold": true`. Payouts will remain locked on hold
            until the <strong>return period window (e.g. 7 or 15 days)</strong> expires. Once
            expired, a background task automatically releases the funds, ensuring hassle-free return
            reversals.
          </p>
        </section>
      </div>
    ),
  },
];
