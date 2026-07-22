import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { OrganizationJsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";

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

const DEFAULT_TITLE = "Stepwise — Learn DSA, one step at a time";
const DEFAULT_DESCRIPTION =
  "Beautiful, interactive, step-by-step visualizations of data structures and algorithms. Pause, step forward, and build real intuition instead of memorizing.";

export const metadata: Metadata = {
  // Absolute base for every canonical/OG URL. Without it, a relative `url` is a
  // build error and OG images resolve to nothing.
  metadataBase: new URL(SITE_URL),
  // `default` is the home/fallback title; `template` gives every child page that
  // only sets a bare `title` the "<page> — Stepwise" suffix for free.
  title: {
    default: DEFAULT_TITLE,
    template: "%s — Stepwise",
  },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Stepwise",
    url: "/",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    // The opengraph-image.tsx file convention auto-wires the tags; listing it
    // here too keeps the URL explicit and lets child pages inherit it.
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  robots: { index: true, follow: true },
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
        <OrganizationJsonLd />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
