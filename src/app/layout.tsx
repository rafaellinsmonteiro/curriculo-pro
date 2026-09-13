import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CurrículoPRO — CRM de Currículos Profissionais",
  description: "Sistema CRM para gerenciamento de leads e automação de currículos profissionais com inteligência artificial.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
