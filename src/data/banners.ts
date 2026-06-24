export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
}
export const banners: Banner[] = [
  {
    id: "b1",
    title: "The Heritage Edit",
    subtitle: "Fifty years of cobbler-grade craft, in every stitch.",
    cta: "Explore the collection",
    href: "/shop",
  },
  {
    id: "b2",
    title: "Free Shipping Over ₹2000",
    subtitle: "On every order, every time.",
    cta: "Shop now",
    href: "/shop",
  },
];
