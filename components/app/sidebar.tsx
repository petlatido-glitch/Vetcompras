"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, ClipboardList, FileText, Home, Package, Receipt, ShoppingCart, Store, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import logoLatido from "./public/logo-latido.png";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/proveedores", label: "Proveedores", icon: Store },
  { href: "/inventario", label: "Inventario", icon: Boxes },
  { href: "/cotizaciones", label: "Cotizaciones", icon: FileText },
  { href: "/comparacion", label: "Comparacion", icon: BarChart3 },
  { href: "/facturas", label: "Facturas de compra", icon: Receipt },
  // Note: Órdenes, Lista de compra, Historial de compras and Historial de precios
  // are hidden from the sidebar but left intact in the codebase.
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative hidden w-64 overflow-hidden rounded-tr-[2.5rem] rounded-br-[2.5rem] border border-[#E9D7C2] bg-[#FFFBF7] shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:flex md:flex-col">
      <div className="absolute -right-10 top-12 h-24 w-24 rounded-full bg-[#FFD6A5]/70 blur-3xl" />
      <div className="absolute -left-12 bottom-12 h-18 w-18 rounded-full bg-[#8EC5E8]/15 blur-2xl" />

      <div className="relative flex h-24 items-center gap-4 border-b border-[#F2E3D7] px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-[#FFF3E6] ring-1 ring-[#F3D9C2] shadow-[0_8px_24px_rgba(243,213,194,0.16)]">
          <Image
            src={logoLatido}
            alt="Latido Veterinaria"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
          />
        </div>
        <div className="flex flex-col justify-center gap-1">
          <p className="text-base font-semibold tracking-[0.02em] text-slate-900">Latido Veterinaria</p>
          <p className="text-[0.68rem] uppercase tracking-[0.3em] text-slate-500">VetCompras</p>
        </div>
      </div>

      <nav className="relative space-y-4 px-5 py-6">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-4 rounded-[2rem] px-4 py-3 text-sm font-semibold text-slate-700 transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white hover:text-slate-900 hover:shadow-[0_10px_25px_rgba(15,23,42,0.05)]",
                active &&
                  "bg-[#FFECE0] text-slate-900 shadow-[0_14px_30px_rgba(243,140,76,0.16)]"
              )}
            >
              <span
                className={cn(
                  "flex h-12 w-12 min-w-[3rem] items-center justify-center rounded-2xl transition duration-200",
                  active ? "bg-[#FFD6A5]" : "bg-[#FFF2E0] group-hover:bg-[#FFE9D1]"
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-white" : "text-[#D87B4A]")} />
              </span>
              <span className="leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
