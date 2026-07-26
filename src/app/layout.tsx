import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { MotionConfig } from "framer-motion";
import { ChatProvider } from "@/context/ChatContext";
import { MessagingProvider } from "@/context/MessagingContext";
import { ScoutProvider } from "@/context/ScoutContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { SidebarPrefsProvider } from "@/context/SidebarPrefsContext";
import { AppShell } from "@/components/layout/AppShell";
import { GlobalCommandPalette } from "@/components/chat/GlobalCommandPalette";
import { MagnusIntro } from "@/components/brand/MagnusIntro";
import "./globals.css";

/** iPhone-safe viewport — enables env(safe-area-inset-*) on notched devices */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
    { media: "(prefers-color-scheme: light)", color: "#f4f6f8" },
  ],
};

/** UI body — Inter Sans (Google Inter) */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

import {
  MAGNUS_OG_IMAGE_ALT,
  MAGNUS_OG_IMAGE_HEIGHT,
  MAGNUS_OG_IMAGE_PATH,
  MAGNUS_OG_IMAGE_WIDTH,
} from "@/lib/og";

const siteDescription =
  "Magnus — AI assistant for Brasfield & Gorrie. Ask questions, search B&G knowledge, and get work done.";

/**
 * Absolute site origin for Open Graph / Twitter card URLs.
 * Prefer NEXT_PUBLIC_SITE_URL in production; fall back to Vercel URL.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`
    : "http://localhost:3000");

/** Canonical social / link-preview image (1200×630) — public/og.png */
const ogImage = {
  url: MAGNUS_OG_IMAGE_PATH,
  width: MAGNUS_OG_IMAGE_WIDTH,
  height: MAGNUS_OG_IMAGE_HEIGHT,
  alt: MAGNUS_OG_IMAGE_ALT,
  type: "image/png" as const,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Magnus",
    template: "%s · Magnus",
  },
  description: siteDescription,
  applicationName: "Magnus",
  authors: [{ name: "Brasfield & Gorrie" }],
  keywords: [
    "Magnus",
    "Brasfield & Gorrie",
    "B&G",
    "AI assistant",
    "intranet",
    "construction",
  ],
  appleWebApp: {
    capable: true,
    title: "Magnus",
    statusBarStyle: "black-translucent",
  },
  icons: {
    // Dark browser chrome → white mark; light chrome → navy mark
    icon: [
      {
        url: "/favicon-light.png",
        media: "(prefers-color-scheme: dark)",
        type: "image/png",
        sizes: "64x64",
      },
      {
        url: "/favicon-dark.png",
        media: "(prefers-color-scheme: light)",
        type: "image/png",
        sizes: "64x64",
      },
      // Fallback when no color-scheme media match
      {
        url: "/favicon.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.png",
  },
  // When anyone shares a Magnus URL (Slack, Teams, iMessage, LinkedIn…)
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Magnus",
    title: "Magnus",
    description: siteDescription,
    url: "/",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Magnus",
    description: siteDescription,
    images: [ogImage.url],
  },
  // Some crawlers still look for these explicitly
  other: {
    "og:image:width": "1200",
    "og:image:height": "630",
  },
};

/** Runs before hydration — theme + intro boot cover (no raw <script> in tree). */
const BOOT_SCRIPT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem("magnus-theme");if(t==="light"||t==="dark"){d.dataset.theme=t;d.classList.toggle("dark",t==="dark");d.classList.toggle("light",t==="light");}var intro=localStorage.getItem("magnus-intro-enabled");if(intro==="0"||intro==="false")return;d.classList.add("magnus-intro-pending");}catch(e){try{document.documentElement.classList.add("magnus-intro-pending");}catch(_){}}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${GeistMono.variable} h-full dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans antialiased" suppressHydrationWarning>
        <Script id="magnus-boot" strategy="beforeInteractive">
          {BOOT_SCRIPT}
        </Script>
        <ThemeProvider>
          <MotionConfig reducedMotion="user">
            <MagnusIntro />
            <ToastProvider>
              <ChatProvider>
                <SidebarPrefsProvider>
                  <MessagingProvider>
                    <ScoutProvider>
                      <AppShell>{children}</AppShell>
                      <GlobalCommandPalette />
                    </ScoutProvider>
                  </MessagingProvider>
                </SidebarPrefsProvider>
              </ChatProvider>
            </ToastProvider>
          </MotionConfig>
        </ThemeProvider>
      </body>
    </html>
  );
}
