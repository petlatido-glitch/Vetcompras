"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardList, FileText, Home, Package, ShoppingCart, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", icon: Home, label: "Inicio" },
  { href: "/proveedores", icon: Store, label: "Prov." },
  { href: "/lista-compra", icon: ClipboardList, label: "Lista" },
  { href: "/cotizaciones", icon: FileText, label: "Cot." },
  { href: "/comparacion", icon: BarChart3, label: "Comp." },
  { href: "/ordenes-compra", icon: ShoppingCart, label: "Ordenes" }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 border-t bg-white lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 px-1 py-2 text-[11px] text-slate-500", active && "text-orange-600")}>
            <Icon className="h-4 w-4" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
