import { formatINR } from "@/lib/format";

interface ProductItem {
  id: string;
  name: string;
  image: string;
  price: number;
  reviewsCount: number;
}

interface TopProductsListProps {
  products: ProductItem[];
  limit?: number;
}

export function TopProductsList({ products, limit = 5 }: TopProductsListProps) {
  return (
    <div className="space-y-4">
      {products.slice(0, limit).map((p, i) => (
        <div key={p.id} className="flex items-center gap-3">
          <span className="font-serif text-muted-foreground w-4">{i + 1}</span>
          <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.reviewsCount} reviews</p>
          </div>
          <p className="text-sm font-semibold">{formatINR(p.price)}</p>
        </div>
      ))}
    </div>
  );
}
