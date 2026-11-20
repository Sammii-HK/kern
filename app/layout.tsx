import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import "./globals.css";

// The interface's own face. Every font being explored loads on demand instead.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Kern: design and test type systems",
  description:
    "Browse Google Fonts by axis, pair a heading, body and mono, build a fluid scale and export it as CSS, Tailwind or design tokens.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Suspense fallback={<div className="h-14 border-b border-border" />}>
            <Nav />
          </Suspense>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>{children}</Suspense>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
