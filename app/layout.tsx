import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Omni Reader",
  description: "Unified news + social + dev + freelance digest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen">{children}</body>
    </html>
  );
}
