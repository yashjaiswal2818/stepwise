import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Archivo: a grotesque drawn for high performance at small sizes, with
// unambiguous digits — the right voice for an instrument. Replaces the
// create-next-app Geist default, which is the single most recognisable
// "generated with a scaffold" tell.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// All numerics in this app are data — indices, addresses, complexities, step
// counts. JetBrains Mono has a real slashed zero and tabular figures.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stepwise — Learn DSA, one step at a time",
  description:
    "Beautiful, interactive, step-by-step visualizations of data structures and algorithms. Pause, step forward, and build real intuition instead of memorizing.",
};

// Set the chosen theme before paint. Default is dark (no attribute needed);
// only light mode sets data-theme, so there is no dark-mode flash.
const themeScript = `try{if(localStorage.getItem('stepwise-theme')==='light'){document.documentElement.dataset.theme='light';}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
