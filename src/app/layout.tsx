import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vyper Labs",
  description: "Retail & Loyalty Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
