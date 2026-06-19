import type { ReactNode } from "react";

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-col gap-6 rounded-[2.25rem] border border-[#E9D8C6] bg-[#FFFCF9] p-8 shadow-[0_24px_55px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-3xl">
        <div className="mb-4 h-1.5 w-20 rounded-full bg-gradient-to-r from-[#FFC28B] via-[#FEE6D9] to-[#A7D0EB]" />
        <h2 className="text-4xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
