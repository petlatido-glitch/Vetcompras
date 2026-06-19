import { LogOut, ShieldCheck } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export function Topbar() {
  return (
    <header className="relative z-30 mx-auto flex w-full max-w-7xl flex-col gap-6 rounded-[2.5rem] border border-[#ECE6DD] bg-white/95 px-6 py-6 shadow-[0_14px_45px_rgba(15,23,42,0.08)] lg:px-8 lg:py-7 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 text-slate-600">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#FFB26B] shadow-[0_0_0_10px_rgba(255,178,107,0.08)]" />
          <p className="text-[0.65rem] uppercase tracking-[0.32em] text-[#F08C5D]">Clínica veterinaria</p>
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900">Administración de compras</h1>
      </div>
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="hidden items-center gap-2 rounded-full border border-[#F4E8DD] bg-[#FEF6EE] px-4 py-2 text-sm text-slate-700 shadow-[0_10px_30px_rgba(243,185,131,0.12)] sm:flex">
          <ShieldCheck className="h-4 w-4 text-[#FFB26B]" />
          Administrador
        </div>
        <form action={signOut}>
          <Button variant="outline" size="icon" title="Cerrar sesión" className="border-[#E9E2D9] bg-white text-slate-600 shadow-sm hover:bg-[#FEF7EE] hover:text-slate-900">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
