import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Mono, DM_Sans } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chemistry-atelier.vercel.app"),
  title: {
    default: "Chemistry Atelier — See matter differently",
    template: "%s · Chemistry Atelier",
  },
  description:
    "Explore all 118 elements, compare periodic trends, balance reactions, and learn chemistry through interactive teaching models.",
  applicationName: "Chemistry Atelier",
  keywords: ["chemistry", "periodic table", "elements", "reactions", "education"],
  openGraph: {
    title: "Chemistry Atelier",
    description: "Interactive elements, atomic structure, periodic trends, and guided reactions.",
    type: "website",
    images: [{ url: "/chemistry-atelier-og.png", width: 1200, height: 630, alt: "A simplified teaching-model atom on a pale mineral grid" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chemistry Atelier",
    description: "Interactive elements, atomic structure, periodic trends, and guided reactions.",
    images: ["/chemistry-atelier-og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#132f31",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
