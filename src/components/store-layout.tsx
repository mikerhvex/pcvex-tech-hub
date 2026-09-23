import type { ReactNode } from "react";
import { SiteHeader } from "./site-header"; import { SiteFooter } from "./site-footer"; import { useCartSync } from "@/hooks/use-cart-sync";
export function StoreLayout({children}:{children:ReactNode}){useCartSync();return <div className="min-h-screen bg-background text-foreground"><SiteHeader/><main>{children}</main><SiteFooter/></div>}