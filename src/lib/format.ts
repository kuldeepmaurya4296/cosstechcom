export const formatINR = (n: number | null | undefined) => {
  if (n === null || n === undefined || isNaN(Number(n))) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n));
};

export const formatNumber = (n: number | null | undefined) => {
  if (n === null || n === undefined || isNaN(Number(n))) return "0";
  return new Intl.NumberFormat("en-IN").format(Number(n));
};

export const formatDate = (s: string | null | undefined | Date) => {
  if (!s) return "—";
  const d = new Date(s);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
