import type { Metadata } from "next";
import { Geist, Archivo_Narrow } from "next/font/google";
// MapLibre styles should be loaded once at the app root.
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { Providers } from "./providers";

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

const brand = Archivo_Narrow({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-brand",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} ${brand.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
