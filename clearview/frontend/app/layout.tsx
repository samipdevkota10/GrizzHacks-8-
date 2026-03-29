import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

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
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/images/logo-icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/images/logo-icon.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  document.querySelectorAll('[bis_skin_checked]').forEach(function(el){
                    el.removeAttribute('bis_skin_checked');
                  });
                  document.querySelectorAll('[bis_register]').forEach(function(el){
                    el.removeAttribute('bis_register');
                  });
                  new MutationObserver(function(mutations){
                    mutations.forEach(function(m){
                      if(m.type==='attributes'){
                        if(m.attributeName==='bis_skin_checked'||m.attributeName==='bis_register'){
                          m.target.removeAttribute(m.attributeName);
                        }
                      }
                    });
                  }).observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:['bis_skin_checked','bis_register']});
                } catch(e){}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-background text-foreground font-sans" suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
