import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://halindosa.com"),
  title: "할인도사 - 실시간 국내 특가 알림",
  description: "실시간 할인 특가 정보를 가장 빠르게 찾는 방법",
  applicationName: "할인도사",
  keywords: ["할인", "특가", "핫딜", "쇼핑", "쿠폰", "국내 쇼핑몰"],
  openGraph: {
    title: "할인도사 - 실시간 국내 특가 알림",
    description: "실시간 할인 특가 정보를 가장 빠르게 찾는 방법",
    type: "website",
    locale: "ko_KR"
  },
  robots: {
    index: true,
    follow: true
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/halindosa-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/halindosa-icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/halindosa-icon-192.png", sizes: "192x192", type: "image/png" }]
  },
  appleWebApp: {
    capable: true,
    title: "할인도사",
    statusBarStyle: "default"
  },
  formatDetection: {
    telephone: false
  },
  alternates: {
    canonical: "/"
  },
  category: "shopping"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#ef233c"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
