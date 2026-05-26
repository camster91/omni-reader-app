import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Omni Reader",
  description: "Your daily digest, done.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="./manifest.json" />
        <meta name="theme-color" content="#020618" />
      </head>
      <body className="bg-[#030712] text-slate-200 antialiased">{children}</body>
    </html>
  );
}
