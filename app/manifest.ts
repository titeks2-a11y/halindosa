import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "할인도사",
    short_name: "할인도사",
    description: "실시간 할인 특가 정보를 가장 빠르게 찾는 방법",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    scope: "/",
    background_color: "#f8fafc",
    theme_color: "#ef233c",
    lang: "ko-KR",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        src: "/halindosa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/halindosa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/halindosa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    shortcuts: [
      {
        name: "오늘의 특가",
        short_name: "오늘 특가",
        description: "오늘 먼저 확인할 할인 정보를 봅니다.",
        url: "/?section=today",
        icons: [{ src: "/halindosa-icon-192.png", sizes: "192x192" }]
      },
      {
        name: "찜한 특가",
        short_name: "찜",
        description: "기기에 저장한 관심 특가를 확인합니다.",
        url: "/favorites",
        icons: [{ src: "/halindosa-icon-192.png", sizes: "192x192" }]
      }
    ]
  };
}
