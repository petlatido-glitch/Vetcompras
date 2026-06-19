import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VetCompras | Administracion de compras veterinarias",
  description: "SaaS privado para comparar cotizaciones y generar ordenes de compra veterinarias.",
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
