import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Client Portal",
  description:
    "Full-stack client portal for projects, files, invoices, and messages.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
