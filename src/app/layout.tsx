import type { Metadata, Viewport } from "next";
import { DM_Mono } from "next/font/google";
import { PWAProvider } from "@/components/common/PWAClient";
import { AppFooter } from "@/components/common/AppFooter";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import "@/styles/globals.css";
import "@/styles/apple-overhaul.css";
import "@/styles/learning.css";
import "@/styles/mobile-refinement.css";

const configuredHost = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? "https://atomic-atelier.vercel.app";
const metadataBase = new URL(configuredHost.startsWith("http") ? configuredHost : `https://${configuredHost}`);

const mono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: true,
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
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#132f31" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1514" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={mono.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem("atomic-atelier-theme");var p=window.matchMedia("(prefers-color-scheme: dark)").matches;var t=s==="dark"||(s!=="light"&&p)?"dark":"light";document.documentElement.setAttribute("data-theme",t);if(t==="dark")document.documentElement.classList.add("dark");}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <PWAProvider>
            {children}
            <AppFooter />
          </PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
