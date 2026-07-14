import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
