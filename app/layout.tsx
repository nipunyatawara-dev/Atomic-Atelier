import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Mono, DM_Sans } from "next/font/google";
import "./globals.css";

const configuredHost = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
const metadataBase = new URL(configuredHost.startsWith("http") ? configuredHost : `https://${configuredHost}`);

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
  metadataBase,
  title: {
    default: "Atomic Atelier — See matter differently",
    template: "%s · Atomic Atelier",
  },
  description:
    "Explore all 118 elements, compare periodic trends, balance reactions, and learn chemistry through interactive teaching models.",
  applicationName: "Atomic Atelier",
  keywords: ["chemistry", "periodic table", "elements", "reactions", "education"],
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Atomic Atelier",
    description: "Interactive elements, atomic structure, periodic trends, and guided reactions.",
    type: "website",
    siteName: "Atomic Atelier",
    url: "/",
    images: [{ url: "/atomic-atelier-share.png", width: 1200, height: 630, alt: "Atomic Atelier — See matter differently, with a simplified teaching-model atom" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Atomic Atelier",
    description: "Interactive elements, atomic structure, periodic trends, and guided reactions.",
    images: ["/atomic-atelier-share.png"],
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
