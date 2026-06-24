export interface Coupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  description: string;
  expiresAt: string;
}
export const coupons: Coupon[] = [
  {
    code: "RAJA10",
    type: "percent",
    value: 10,
    description: "10% off your first order",
    expiresAt: "2025-12-31",
  },
  {
    code: "FREESHIP",
    type: "fixed",
    value: 0,
    description: "Free shipping on orders over ₹2000",
    expiresAt: "2025-12-31",
  },
];
