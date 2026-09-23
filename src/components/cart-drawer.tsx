import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatMoney } from "@/lib/shopify";
import { useCartStore } from "@/stores/cart-store";

export function CartDrawer() {
  const [open,setOpen]=useState(false); const {items,checkoutUrl,isLoading,syncCart,updateQuantity,removeItem}=useCartStore();
  useEffect(()=>{ if(open) syncCart(); },[open,syncCart]);
  const count=items.reduce((sum,item)=>sum+item.quantity,0); const total=items.reduce((sum,item)=>sum+Number(item.variant.price.amount)*item.quantity,0);
  return <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Abrir carrito" className="relative"><ShoppingBag />{count>0&&<span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-accent-blue px-1 text-[10px] font-bold text-accent-blue-foreground">{count}</span>}</Button></SheetTrigger>
    <SheetContent className="flex w-full flex-col sm:max-w-md"><SheetHeader><SheetTitle>Tu carrito</SheetTitle><SheetDescription>{count ? `${count} producto${count===1?"":"s"}` : "Tu carrito está vacío"}</SheetDescription></SheetHeader>
      <div className="mt-6 flex-1 overflow-y-auto">{items.map((item)=>{const image=item.product.images.edges[0]?.node; return <div key={item.variant.id} className="grid grid-cols-[72px_minmax(0,1fr)_auto] gap-3 border-b border-border py-4">{image?<img src={image.url} alt="" className="aspect-square rounded-md object-cover"/>:<div/>}<div className="min-w-0"><p className="truncate text-sm font-semibold">{item.product.title}</p><p className="mt-1 text-sm text-muted-foreground">{formatMoney(item.variant.price)}</p><div className="mt-3 flex items-center gap-2"><Button variant="outline" size="icon" className="h-7 w-7" onClick={()=>updateQuantity(item.variant.id,item.quantity-1)}><Minus/></Button><span className="w-5 text-center text-sm">{item.quantity}</span><Button variant="outline" size="icon" className="h-7 w-7" onClick={()=>updateQuantity(item.variant.id,item.quantity+1)}><Plus/></Button></div></div><Button variant="ghost" size="icon" aria-label="Eliminar" onClick={()=>removeItem(item.variant.id)}><Trash2/></Button></div>})}</div>
      {items.length>0&&<div className="border-t border-border pt-5"><div className="mb-5 flex justify-between text-lg font-bold"><span>Total</span><span>{new Intl.NumberFormat("es-PE",{style:"currency",currency:items[0]?.variant.price.currencyCode??"PEN"}).format(total)}</span></div><Button className="w-full" size="lg" disabled={isLoading||!checkoutUrl} onClick={()=>checkoutUrl&&window.open(checkoutUrl,"_blank")}>Finalizar compra</Button><p className="mt-3 text-center text-xs text-muted-foreground">Pago seguro procesado por Shopify</p></div>}
    </SheetContent></Sheet>;
}