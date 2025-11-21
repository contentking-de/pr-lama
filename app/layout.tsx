import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PR Lama - Digitale PR Management",
  description: "Plattform zur Digitalisierung und Automatisierung von digitalen PR-Maßnahmen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}

