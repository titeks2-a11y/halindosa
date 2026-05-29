import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "할인도사 - 실시간 국내 특가 알림",
  description: "국내 인기 쇼핑몰의 할인 특가 정보를 한눈에 확인하세요.",
  applicationName: "할인도사",
  keywords: ["할인", "특가", "핫딜", "쇼핑", "쿠폰", "국내 쇼핑몰"],
  openGraph: {
    title: "할인도사 - 실시간 국내 특가 알림",
    description: "국내 인기 쇼핑몰의 할인 특가 정보를 한눈에 확인하세요.",
    type: "website",
    locale: "ko_KR"
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
