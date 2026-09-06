import type { Metadata } from "next";
import { AutoScan } from "@/components/auto-scan";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workspace Hub",
  description: "Mission control for projects, funnels & freelance ops",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 antialiased min-h-screen">
        <AutoScan />
        {children}
      </body>
    </html>
  );
}
