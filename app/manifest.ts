import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "할인도사",
    short_name: "할인도사",
    description: "실시간 할인 특가 정보를 가장 빠르게 찾는 방법",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#ef233c",
    lang: "ko-KR",
    categories: ["shopping", "lifestyle"]
  };
}
