"use client";

import Link from "next/link";
import Script from "next/script";
import { useCart } from "@/lib/cart-store";
import { formatINR } from "@/lib/format";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Plus, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useSettings } from "@/lib/settings-context";

// Shared and sub-components
import { OrderSummary } from "@/components/shared/OrderSummary";
import { CheckoutStepsHeader } from "@/modules/checkout/components/CheckoutStepsHeader";
import { OrderConfirmation } from "@/modules/orders/components/OrderConfirmation";
import { Input } from "@/components/shared/Input";

export default function CheckoutPage() {
  const { data: session } = useSession();
  const { lines, subtotal, clear } = useCart();
  const settings = useSettings();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Address State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  // Stock validation state
  const [stockErrors, setStockErrors] = useState<Record<string, string>>({});
  const [checkingStock, setCheckingStock] = useState(false);

  // Legal Policy Agreement
  const [policyAccepted, setPolicyAccepted] = useState(false);

  useEffect(() => {
    if (lines.length === 0) return;

    const checkStock = async () => {
      setCheckingStock(true);
      try {
        const errors: Record<string, string> = {};
        for (const line of lines) {
          const res = await fetch(`/api/products/${line.productId}`);
          if (res.ok) {
            const product = await res.json();
            const variant = product.variants?.find(
              (v: any) => v.size === line.size && v.color === line.color,
            );
            const key = `${line.productId}-${line.size}-${line.color}`;
            if (!variant) {
              errors[key] = "Variant unavailable";
            } else if (variant.stock === 0) {
              errors[key] = "Out of Stock";
            } else if (variant.stock < line.quantity) {
              errors[key] = `Only ${variant.stock} left in stock`;
            }
          }
        }
        setStockErrors(errors);
      } catch (err) {
        console.error("Failed to validate stock:", err);
      } finally {
        setCheckingStock(false);
      }
    };

    checkStock();
  }, [lines]);

  useEffect(() => {
    if (!session?.user?.id) {
      setFullName("");
      setPhone("");
      setLine1("");
      setLine2("");
      setCity("");
      setState("");
      setZip("");
      return;
    }

    fetch("/api/user/addresses")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSavedAddresses(data);
          const def = data.find((a) => a.isDefault);
          if (def) {
            setSelectedAddressId(def._id);
            setFullName(def.fullName || "");
            setPhone(def.phone || "");
            setLine1(def.line1 || "");
            setLine2(def.line2 || "");
            setCity(def.city || "");
            setState(def.state || "");
            setZip(def.pin || "");
          } else if (data.length > 0) {
            setSelectedAddressId(data[0]._id);
            setFullName(data[0].fullName || "");
            setPhone(data[0].phone || "");
            setLine1(data[0].line1 || "");
            setLine2(data[0].line2 || "");
            setCity(data[0].city || "");
            setState(data[0].state || "");
            setZip(data[0].pin || "");
          } else {
            setFullName(session.user.name || "");
          }
        }
      })
      .catch(console.error);
  }, [session?.user?.id, session?.user?.name]);

  const handleSelectAddress = (addr: any) => {
    if (addr === "new") {
      setSelectedAddressId("new");
      setFullName("");
      setPhone("");
      setLine1("");
      setLine2("");
      setCity("");
      setState("");
      setZip("");
    } else {
      setSelectedAddressId(addr._id);
      setFullName(addr.fullName || "");
      setPhone(addr.phone || "");
      setLine1(addr.line1 || "");
      setLine2(addr.line2 || "");
      setCity(addr.city || "");
      setState(addr.state || "");
      setZip(addr.pin || "");
    }
  };

  // Shipping State
  const [shippingMethod, setShippingMethod] = useState("Standard");
  const [shippingCost, setShippingCost] = useState(0);

  // Update default shipping method once settings are loaded
  useEffect(() => {
    if (settings?.shippingMethods?.length > 0) {
      const firstMethod = settings.shippingMethods[0];
      setShippingMethod(firstMethod.name);
      setShippingCost(firstMethod.price);
    }
  }, [settings]);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"Online" | "COD">("Online");

  // Adjust default payment option when settings load
  useEffect(() => {
    if (settings && settings.loading === false) {
      if (settings.razorpayEnabled === false && settings.codEnabled !== false) {
        setPaymentMethod("COD");
      } else if (settings.codEnabled === false && settings.razorpayEnabled !== false) {
        setPaymentMethod("Online");
      }
    }
  }, [settings]);

  // Coupon States
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");

  // Loyalty Points States
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(false);

  // Wallet States
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    // Fetch Loyalty
    fetch("/api/user/loyalty")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.balance === "number") {
          setLoyaltyPoints(data.balance);
        }
      })
      .catch(console.error);

    // Fetch Wallet balance from Profile
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data.user && typeof data.user.walletBalance === "number") {
          setWalletBalance(data.user.walletBalance);
        }
      })
      .catch(console.error);
  }, [session?.user?.id]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMessage("Please enter a coupon code");
      return;
    }
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, cartValue: subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponApplied(true);
        setCouponMessage(data.message);
        let discount = 0;
        if (data.type === "percent") {
          discount = Math.round(subtotal * (data.value / 100));
        } else if (data.type === "fixed") {
          discount = data.value;
        }
        setCouponDiscount(discount);
        toast.success("Coupon applied successfully!");
      } else {
        setCouponApplied(false);
        setCouponDiscount(0);
        setCouponMessage(data.message || "Invalid coupon code");
        toast.error(data.message || "Invalid coupon code");
      }
    } catch (err) {
      toast.error("Failed to validate coupon");
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setCouponCode("");
    setCouponDiscount(0);
    setCouponMessage("");
    toast.info("Coupon removed");
  };

  const taxableAmount = Math.max(0, subtotal - couponDiscount);
  const tax = Math.round(taxableAmount * (settings.taxRate / 100));
  const totalBeforePoints = Math.max(0, taxableAmount + shippingCost + tax);
  const pointsDiscount = redeemPoints ? Math.min(loyaltyPoints, totalBeforePoints) : 0;
  const totalAfterPoints = Math.max(0, totalBeforePoints - pointsDiscount);
  const walletDiscount = useWallet ? Math.min(walletBalance, totalAfterPoints) : 0;
  const total = Math.max(0, totalAfterPoints - walletDiscount);

  const handleShippingChange = (name: string, price: number) => {
    setShippingMethod(name);
    setShippingCost(price);
  };

  const handlePlaceOrder = async () => {
    if (loading) return;
    if (!fullName || !phone || !line1 || !city || !state || !zip) {
      toast.error("Please fill in all address details");
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      // 1. Create order in our Database (in PENDING state)
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id || null,
          items: lines.map((l) => ({
            productId: l.productId,
            name: l.name,
            image: l.image,
            size: l.size,
            color: l.color,
            price: l.price,
            qty: l.quantity,
          })),
          shippingAddress: {
            fullName,
            phone,
            line1,
            line2,
            city,
            state,
            pin: zip,
            country: "India",
          },
          pricing: {
            subtotal,
            shipping: shippingCost,
            couponDiscount,
            pointsDiscount,
            walletAmountUsed: walletDiscount,
            total,
          },
          coupon: couponApplied
            ? {
                code: couponCode,
                discountAmount: couponDiscount,
              }
            : undefined,
          payment: {
            method: paymentMethod === "COD" ? "COD" : "UPI",
            status: "PENDING",
          },
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Order placement failed");
      }

      const localOrder = orderData.order;
      const orderId = localOrder?.orderId || `COSS-${Date.now()}`;

      // 2. Handle payment based on paymentMethod
      if (paymentMethod === "COD") {
        toast.success("Order placed successfully (Cash on Delivery)!");
        setPlacedOrderId(orderId);
        clear();
        setDone(true);
        return;
      }

      // Digital payment (UPI or Card) using Razorpay
      // 2A. Request Razorpay order from backend
      const rzpOrderRes = await fetch("/api/orders/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total, // Pass amount in INR directly (backend will convert to paise)
          receipt: orderId,
        }),
      });

      const rzpOrderData = await rzpOrderRes.json();
      if (!rzpOrderRes.ok) {
        throw new Error(rzpOrderData.error || "Failed to create Razorpay transaction");
      }

      const cancelOrder = async (reason: string) => {
        setLoading(true);
        try {
          await fetch("/api/orders", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              status: "CANCELLED",
              note: reason,
            }),
          });
        } catch (err) {
          console.error("Failed to cancel pending order:", err);
        } finally {
          setLoading(false);
        }
      };

      // 2B. Trigger Razorpay checkout flow
      const razorpayKey =
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || rzpOrderData.key_id || "rzp_test_dummykey";

      if (typeof window !== "undefined" && (window as any).Razorpay) {
        const options = {
          key: razorpayKey,
          amount: rzpOrderData.amount,
          currency: rzpOrderData.currency || "INR",
          name: "CosstechCom",
          description: "Order Checkout Payment",
          order_id: rzpOrderData.id,
          handler: async function (response: any) {
            setLoading(true);
            try {
              // Verify signature
              const verifyRes = await fetch("/api/orders/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId,
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                toast.success("Payment verified and order confirmed!");
                setPlacedOrderId(orderId);
                clear();
                setDone(true);
              } else {
                toast.error(verifyData.error || "Payment verification failed");
              }
            } catch (err: any) {
              toast.error(err.message || "Verification request failed");
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              toast.error("Payment window closed. Order cancelled.");
              cancelOrder("Payment window dismissed by customer.");
            },
          },
          prefill: {
            name: fullName,
            contact: phone,
            email: session?.user?.email || "customer@example.com",
          },
          theme: {
            color: "#1E3A5F",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          toast.error(response.error?.description || "Payment failed. Order cancelled.");
          cancelOrder(`Payment failed: ${response.error?.description || "Unknown reason"}`);
        });
        rzp.open();
      } else {
        // Razorpay SDK missing fallback (sandbox/dev simulation)
        toast.info("Razorpay script not ready. Simulating payment success...");
        setTimeout(async () => {
          try {
            const verifyRes = await fetch("/api/orders/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: rzpOrderData.id,
                razorpay_payment_id: `pay_${Math.random().toString(36).substring(7)}`,
                razorpay_signature: "simulated_signature",
                orderId,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              toast.success("Payment simulated successfully! Order confirmed.");
              setPlacedOrderId(orderId);
              clear();
              setDone(true);
            } else {
              toast.error("Failed to verify simulated payment");
            }
          } catch (err: any) {
            toast.error("Simulation verification request failed");
          } finally {
            setLoading(false);
          }
        }, 1500);
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during checkout");
      setLoading(false);
    }
  };

  if (lines.length === 0 && !done) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center max-w-md">
        <div className="h-16 w-16 bg-brass/10 rounded-full flex items-center justify-center mx-auto mb-6 text-cognac">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>
        <h2 className="font-serif text-2xl font-bold text-charcoal mb-2">Your Bag is Empty</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Before you proceed to checkout, you must add some beautiful styles to your shopping bag.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 bg-charcoal text-cream hover:bg-cognac px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
        >
          Explore the Collection
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  if (done) {
    return <OrderConfirmation orderId={placedOrderId || undefined} />;
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
        <div className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.35em] text-cognac font-extrabold mb-1.5">
            Secure Transaction
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-charcoal tracking-tight">
            Checkout
          </h1>
        </div>

        {/* Wizard Steps Header */}
        <CheckoutStepsHeader step={step} />

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-card/70 backdrop-blur-md border border-border/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-md">
            {step === 1 && (
              <>
                <h2 className="font-serif text-xl font-bold text-charcoal">Shipping Address</h2>

                {savedAddresses.length > 0 && (
                  <div className="mb-6">
                    <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-3">
                      Select a Saved Address
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3.5">
                      {savedAddresses.map((a) => {
                        const isSelected = selectedAddressId === a._id;
                        return (
                          <div
                            key={a._id}
                            onClick={() => handleSelectAddress(a)}
                            className={`border rounded-2xl p-4.5 cursor-pointer hover:bg-cream/40 transition-all duration-300 ${
                              isSelected
                                ? "border-cognac bg-cognac/5 shadow-xs"
                                : "border-border bg-card"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`font-bold text-[10px] uppercase tracking-widest ${isSelected ? "text-cognac" : "text-muted-foreground"}`}
                              >
                                {a.label}
                              </span>
                              {a.isDefault && (
                                <span className="text-[9px] font-extrabold bg-brass/10 text-cognac px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-xs mb-1 text-charcoal">{a.fullName}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {a.line1}
                              {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} - {a.pin}
                            </p>
                          </div>
                        );
                      })}

                      <div
                        onClick={() => handleSelectAddress("new")}
                        className={`border border-dashed rounded-2xl p-4.5 cursor-pointer hover:border-cognac hover:bg-cream/30 flex flex-col justify-center items-center text-center transition min-h-[105px] ${
                          selectedAddressId === "new"
                            ? "border-cognac bg-cognac/5"
                            : "border-border/80 bg-card"
                        }`}
                      >
                        <Plus className="h-4.5 w-4.5 text-cognac mb-1.5" />
                        <span className="font-bold text-xs text-muted-foreground">
                          Deliver to a new address
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {savedAddresses.length > 0 && (
                  <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mt-6 mb-3">
                    {selectedAddressId === "new"
                      ? "Enter Address Details"
                      : "Confirm or Edit Address Details"}
                  </p>
                )}

                <div className="grid md:grid-cols-2 gap-4.5">
                  <Input
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <Input
                    label="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <Input
                    label="Address Line 1"
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    wide
                  />
                  <Input
                    label="Address Line 2"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                    wide
                  />
                  <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
                  <Input label="State" value={state} onChange={(e) => setState(e.target.value)} />
                  <Input
                    label="ZIP / PIN Code"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-serif text-xl font-bold text-charcoal">Shipping Method</h2>
                <div className="space-y-3">
                  {settings.shippingMethods.map(({ name, desc, price }) => {
                    const isChecked = shippingMethod === name;
                    return (
                      <label
                        key={name}
                        className={`flex items-center justify-between border rounded-2xl p-4.5 cursor-pointer hover:bg-cream/40 transition-all duration-300 ${
                          isChecked ? "border-cognac bg-cognac/5" : "border-border/80 bg-card"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <input
                            type="radio"
                            name="ship"
                            checked={isChecked}
                            onChange={() => handleShippingChange(name, price)}
                            className="h-4 w-4 text-cognac focus:ring-cognac border-border cursor-pointer accent-cognac"
                          />
                          <div>
                            <div className="font-serif font-bold text-sm text-charcoal">{name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                          </div>
                        </div>
                        <span className="font-bold text-sm text-charcoal">
                          {price === 0 ? "Free" : formatINR(price)}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="border-t border-border/40 pt-6 mt-6">
                  <h3 className="font-serif text-lg font-bold text-charcoal mb-3">Apply Coupon</h3>
                  <div className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      placeholder="Enter coupon code (e.g. COSS10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={couponApplied}
                      className="flex-1 px-4 py-2.5 bg-cream/35 border border-border/80 rounded-xl text-xs font-semibold uppercase tracking-wider outline-none focus:border-cognac focus:ring-1 focus:ring-brass/40 transition-all duration-300 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={couponApplied ? handleRemoveCoupon : handleApplyCoupon}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all duration-300 ${
                        couponApplied
                          ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                          : "bg-charcoal/10 text-charcoal hover:bg-charcoal/20 border border-charcoal/10"
                      }`}
                    >
                      {couponApplied ? "Remove" : "Apply"}
                    </button>
                  </div>
                  {couponMessage && (
                    <p
                      className={`text-xs mt-2 font-bold ${couponApplied ? "text-green-600 animate-in fade-in" : "text-destructive animate-in fade-in"}`}
                    >
                      {couponMessage}
                    </p>
                  )}
                </div>

                {/* Loyalty Points Section */}
                {session && loyaltyPoints > 0 && (
                  <div className="border-t border-border/40 pt-6 mt-6">
                    <h3 className="font-serif text-lg font-bold text-charcoal mb-2 flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-cognac" />
                      Redeem Loyalty Points
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      You have{" "}
                      <span className="font-bold text-charcoal">{loyaltyPoints} points</span>{" "}
                      available (worth {formatINR(loyaltyPoints)}).
                    </p>
                    <label className="flex items-center gap-3 border border-dashed rounded-2xl p-4.5 cursor-pointer bg-amber-50/15 border-amber-300/40 hover:bg-amber-50/20 transition-all duration-300">
                      <input
                        type="checkbox"
                        checked={redeemPoints}
                        onChange={(e) => setRedeemPoints(e.target.checked)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-border cursor-pointer accent-amber-600"
                      />
                      <div>
                        <span className="font-serif font-bold text-sm text-charcoal">
                          Redeem points for this order
                        </span>
                        <span className="text-xs text-muted-foreground block mt-0.5">
                          Applies a discount of{" "}
                          {formatINR(Math.min(loyaltyPoints, totalBeforePoints))}
                        </span>
                      </div>
                    </label>
                  </div>
                )}

                {/* Wallet Balance Section */}
                {session && walletBalance > 0 && (
                  <div className="border-t border-border/40 pt-6 mt-6">
                    <h3 className="font-serif text-lg font-bold text-charcoal mb-2 flex items-center gap-2">
                      <Landmark className="h-4.5 w-4.5 text-cognac" />
                      Use Wallet Balance
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      You have{" "}
                      <span className="font-bold text-charcoal">{formatINR(walletBalance)}</span>{" "}
                      available in your wallet.
                    </p>
                    <label className="flex items-center gap-3 border border-dashed rounded-2xl p-4.5 cursor-pointer bg-emerald-50/15 border-emerald-300/40 hover:bg-emerald-50/20 transition-all duration-300">
                      <input
                        type="checkbox"
                        checked={useWallet}
                        onChange={(e) => setUseWallet(e.target.checked)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-border cursor-pointer accent-emerald-600"
                      />
                      <div>
                        <span className="font-serif font-bold text-sm text-charcoal">
                          Deduct from wallet balance
                        </span>
                        <span className="text-xs text-muted-foreground block mt-0.5">
                          Applies a deduction of{" "}
                          {formatINR(Math.min(walletBalance, totalAfterPoints))}
                        </span>
                      </div>
                    </label>
                  </div>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-serif text-xl font-bold text-charcoal">Payment Method</h2>
                <div className="space-y-3 mb-5">
                  {[
                    ...(settings.razorpayEnabled !== false
                      ? [
                          {
                            key: "Online",
                            name: "Pay Online Secured (Card, UPI, Wallet, Net Banking)",
                          },
                        ]
                      : []),
                    ...(settings.codEnabled !== false
                      ? [{ key: "COD", name: "Cash On Delivery (COD)" }]
                      : []),
                  ].map(({ key, name }) => {
                    const isChecked = paymentMethod === key;
                    return (
                      <label
                        key={key}
                        className={`flex items-center gap-3.5 border rounded-2xl p-4.5 cursor-pointer hover:bg-cream/40 transition-all duration-300 ${
                          isChecked ? "border-cognac bg-cognac/5" : "border-border/80 bg-card"
                        }`}
                      >
                        <input
                          type="radio"
                          name="pay"
                          checked={isChecked}
                          onChange={() => setPaymentMethod(key as any)}
                          className="h-4 w-4 text-cognac focus:ring-cognac border-border cursor-pointer accent-cognac"
                        />
                        <span className="font-serif font-bold text-sm text-charcoal">{name}</span>
                      </label>
                    );
                  })}
                  {settings.razorpayEnabled === false && settings.codEnabled === false && (
                    <div className="text-sm font-semibold text-destructive bg-red-50 border border-red-200 p-4 rounded-xl">
                      No payment methods are currently configured. Please contact support.
                    </div>
                  )}
                </div>
                {paymentMethod !== "COD" && settings.razorpayEnabled !== false && (
                  <div className="bg-brass/5 border border-brass/20 p-4 rounded-xl text-xs text-cognac leading-relaxed">
                    Secure digital payment checkout is powered by Razorpay. Supported features:
                    Direct UPI, Cards, Net Banking, and Wallet apps.
                  </div>
                )}

                {/* Legal Policy Agreement */}
                <div className="mt-6 border-t border-border/40 pt-6">
                  <div className="flex items-start gap-3">
                    <div className="relative mt-0.5">
                      <input
                        id="policy-accept"
                        type="checkbox"
                        checked={policyAccepted}
                        onChange={(e) => setPolicyAccepted(e.target.checked)}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor="policy-accept"
                        className={`flex items-center justify-center h-5 w-5 rounded-md border-2 cursor-pointer transition-all duration-300 ${
                          policyAccepted
                            ? "bg-cognac border-cognac shadow-sm shadow-cognac/30"
                            : "border-border/80 bg-card hover:border-cognac/50"
                        }`}
                      >
                        {policyAccepted && (
                          <svg
                            className="h-3 w-3 text-cream"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </label>
                    </div>
                    <label
                      htmlFor="policy-accept"
                      className="text-xs leading-relaxed text-muted-foreground cursor-pointer select-none"
                    >
                      I have read and agree to the store&apos;s{" "}
                      <Link
                        href="/privacy-policy"
                        target="_blank"
                        className="text-cognac font-bold underline underline-offset-2 hover:text-charcoal transition-colors"
                      >
                        Privacy Policy
                      </Link>
                      ,{" "}
                      <Link
                        href="/terms"
                        target="_blank"
                        className="text-cognac font-bold underline underline-offset-2 hover:text-charcoal transition-colors"
                      >
                        Terms &amp; Conditions
                      </Link>
                      ,{" "}
                      <Link
                        href="/delivery-policy"
                        target="_blank"
                        className="text-cognac font-bold underline underline-offset-2 hover:text-charcoal transition-colors"
                      >
                        Delivery Policy
                      </Link>
                      , and{" "}
                      <Link
                        href="/refund-policy"
                        target="_blank"
                        className="text-cognac font-bold underline underline-offset-2 hover:text-charcoal transition-colors"
                      >
                        Refund &amp; Returns Policy
                      </Link>
                      .
                    </label>
                  </div>
                  {!policyAccepted && (
                    <div className="flex items-center gap-2 mt-3 ml-8 animate-in fade-in slide-in-from-top-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-brass" />
                      <span className="text-[10px] font-bold text-brass uppercase tracking-wider">
                        Policy acceptance is required to proceed
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-between pt-6 border-t border-border/40 mt-8">
              <button
                disabled={step === 1 || loading}
                onClick={() => setStep((step - 1 || 1) as 1 | 2 | 3)}
                className="text-xs uppercase tracking-wider font-extrabold disabled:opacity-30 px-5 py-3 hover:bg-muted/60 rounded-full transition-all duration-300 cursor-pointer text-muted-foreground hover:text-charcoal"
              >
                ← Back
              </button>

              <button
                disabled={
                  loading ||
                  Object.keys(stockErrors).length > 0 ||
                  (step === 3 &&
                    (!policyAccepted ||
                      (settings.razorpayEnabled === false && settings.codEnabled === false)))
                }
                onClick={() => {
                  if (Object.keys(stockErrors).length > 0) {
                    toast.error("Please remove out of stock items from your cart to proceed.");
                    return;
                  }
                  if (step === 1) {
                    if (!fullName.trim()) {
                      toast.error("Full name is required");
                      return;
                    }
                    if (!phone.trim()) {
                      toast.error("Phone number is required");
                      return;
                    }
                    if (!/^[6-9]\d{9}$/.test(phone.replace(/\s+/g, ""))) {
                      toast.error("Enter a valid 10-digit Indian mobile number");
                      return;
                    }
                    if (!line1.trim()) {
                      toast.error("Address line 1 is required");
                      return;
                    }
                    if (!city.trim()) {
                      toast.error("City is required");
                      return;
                    }
                    if (!state.trim()) {
                      toast.error("State is required");
                      return;
                    }
                    if (!zip.trim()) {
                      toast.error("ZIP/PIN code is required");
                      return;
                    }
                    if (!/^\d{6}$/.test(zip.trim())) {
                      toast.error("Enter a valid 6-digit Indian PIN code");
                      return;
                    }
                    setStep(2);
                  } else if (step === 2) {
                    setStep(3);
                  } else {
                    if (!policyAccepted) {
                      toast.error("Please accept the legal policies before placing your order.");
                      return;
                    }
                    handlePlaceOrder();
                  }
                }}
                className="bg-charcoal text-cream hover:bg-cognac rounded-full px-8 py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "Processing..." : step < 3 ? "Continue" : "Place Order"}
              </button>
            </div>
          </div>
          <aside className="h-fit">
            <OrderSummary
              subtotal={subtotal}
              shipping={shippingCost}
              tax={tax}
              taxRate={settings.taxRate}
              couponDiscount={couponDiscount}
              couponCode={couponCode}
              pointsDiscount={pointsDiscount}
              actionButton={
                <div className="border-t border-border/40 pt-5 mt-3">
                  <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-3">
                    Items in your bag ({lines.length})
                  </p>
                  <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                    {lines.map((l) => {
                      const key = `${l.productId}-${l.size}-${l.color}`;
                      const errorMsg = stockErrors[key];
                      return (
                        <div
                          key={l.productId + l.size + l.color}
                          className="flex gap-3 text-xs md:text-sm"
                        >
                          <img
                            src={l.image}
                            alt=""
                            width={48}
                            height={48}
                            loading="lazy"
                            decoding="async"
                            className="h-12 w-12 rounded-lg object-cover border border-border/40 shadow-2xs"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-charcoal leading-tight truncate">
                              {l.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 flex gap-2 items-center">
                              <span>Qty: {l.quantity}</span>
                              <span className="text-border">|</span>
                              <span>Size: UK {l.size}</span>
                              <span className="text-border">|</span>
                              <span>{l.color}</span>
                            </div>
                            {errorMsg && (
                              <div className="text-[9px] font-extrabold text-destructive mt-1 animate-pulse">
                                {errorMsg}
                              </div>
                            )}
                          </div>
                          <div className="font-bold text-charcoal text-xs">
                            {formatINR(l.price * l.quantity)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              }
            />
          </aside>
        </div>
      </div>
    </>
  );
}
