import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScrumTool — Frictionless Daily Standups & Hours Tracker",
  description: "Simple, zero-friction daily standups and task hours logging for agile teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
