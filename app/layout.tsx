import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import { ViewerGate } from "@/components/auth/viewer-gate";
import { ViewerFallback } from "@/components/auth/viewer-fallback";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "UNLV Mountain Club",
  description: "The official website of the UNLV Mountain Club, dedicated to outdoor adventures and community building.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <Suspense fallback={<ViewerFallback />}>
          <ViewerGate>{children}</ViewerGate>
        </Suspense>
      </body>
    </html>
  );
}
