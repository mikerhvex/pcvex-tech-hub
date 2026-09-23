import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney, type ShopifyProduct } from "@/lib/shopify";

export function ProductCard({ product }: { product: ShopifyProduct }) {
  const variant = product.variants.edges[0]?.node; const image = product.images.edges[0]?.node;
  return <article className="group min-w-0">
    <Link to="/producto/$handle" params={{ handle: product.handle }} className="block overflow-hidden rounded-lg bg-surface-subtle">
      {image ? <img src={image.url} alt={image.altText ?? product.title} loading="lazy" width={720} height={720} className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]" /> : <div className="aspect-square" />}
    </Link>
    <div className="pt-4">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0">
        <p className="mb-1 text-xs font-semibold uppercase text-accent-blue">{product.productType || "Tecnología"}</p>
        <Link to="/producto/$handle" params={{ handle: product.handle }} className="font-semibold text-foreground hover:text-accent-blue">{product.title}</Link>
      </div>{product.tags.includes("oferta") && <span className="shrink-0 rounded-sm bg-sale px-2 py-1 text-xs font-bold text-sale-foreground">Oferta</span>}</div>
      {variant && <div className="mt-2 flex items-baseline gap-2"><span className="text-lg font-bold">{formatMoney(variant.price)}</span>{variant.compareAtPrice && <span className="text-sm text-muted-foreground line-through">{formatMoney(variant.compareAtPrice)}</span>}</div>}
      <Button asChild variant="outline" className="mt-4 w-full"><Link to="/producto/$handle" params={{ handle: product.handle }}>Ver producto <ArrowUpRight /></Link></Button>
    </div>
  </article>;
}