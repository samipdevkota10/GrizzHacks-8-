import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vera Fund — Your All-in-One Financial Advisor",
  description:
    "AI-powered personal finance platform. Track spending, manage budgets, analyze purchases, and get intelligent financial advice.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased min-h-screen bg-background text-foreground font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
