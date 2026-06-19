import { MobileNav } from "@/components/app/mobile-nav";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFFDF9] text-slate-900">
      <div className="md:flex">
        <Sidebar />
        <div className="flex-1">
          <Topbar />
          <main className="mx-auto w-full max-w-7xl px-4 py-8 pb-24 lg:px-8 lg:pb-8">{children}</main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
