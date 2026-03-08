import type { Metadata } from "next";
import {
  Inter,
  Recursive,
  Roboto_Flex,
  Playfair_Display,
  Source_Serif_4,
} from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  axes: ["opsz"],
});

const recursive = Recursive({
  variable: "--font-recursive",
  subsets: ["latin"],
  axes: ["CASL", "CRSV", "MONO", "slnt"],
});

const robotoFlex = Roboto_Flex({
  variable: "--font-roboto-flex",
  subsets: ["latin"],
  axes: ["opsz", "wdth", "GRAD", "slnt"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Kern — Interactive Typography Explorer",
  description:
    "Explore variable fonts, optical sizing, and fluid type scales. A design engineering portfolio piece.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${recursive.variable} ${robotoFlex.variable} ${playfairDisplay.variable} ${sourceSerif4.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Nav />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
