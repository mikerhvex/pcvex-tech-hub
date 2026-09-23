import type { ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "./product-card";
export function ProductGrid({ products }: { products: ShopifyProduct[] }) {
  if (!products.length) return <div className="py-20 text-center text-muted-foreground">No se encontraron productos.</div>;
  return <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-8">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}