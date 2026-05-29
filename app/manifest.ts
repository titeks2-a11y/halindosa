import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "할인도사",
    short_name: "할인도사",
    description: "국내 인기 쇼핑몰의 할인 특가 정보를 한눈에 확인하세요.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#ef233c",
    lang: "ko-KR",
    categories: ["shopping", "lifestyle"]
  };
}
