import { NextResponse } from "next/server";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";

const allowedHosts = new Set(["cdn.ppomppu.co.kr", "cdn2.ppomppu.co.kr", "cdn3.ppomppu.co.kr"]);
const maxImageBytes = 5 * 1024 * 1024;

function isAllowedImageUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && allowedHosts.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function imageError(message: string, status: number, headers: HeadersInit) {
  return NextResponse.json({ ok: false, message }, { status, headers });
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limitResult = rateLimit({
    key: getClientKey(request, "image"),
    limit: 240,
    windowMs: 60_000
  });
  const errorHeaders = rateLimitHeaders(limitResult, requestId);

  if (!limitResult.allowed) {
    return imageError("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", 429, errorHeaders);
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get("url");

    if (!rawUrl) {
      return imageError("이미지 URL이 없습니다.", 400, errorHeaders);
    }

    if (!isAllowedImageUrl(rawUrl)) {
      return imageError("허용되지 않은 이미지 도메인입니다.", 400, errorHeaders);
    }

    const target = new URL(rawUrl);
    const response = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Halindosa/1.0)",
        Referer: "https://www.ppomppu.co.kr/"
      },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 3600 }
    });

    if (!response.ok || !response.body) {
      return imageError("이미지를 불러오지 못했습니다.", 502, errorHeaders);
    }

    if (!isAllowedImageUrl(response.url)) {
      return imageError("이미지 리다이렉트 대상이 허용되지 않았습니다.", 400, errorHeaders);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return imageError("이미지 응답이 아닙니다.", 415, errorHeaders);
    }

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > maxImageBytes) {
      return imageError("이미지 파일이 너무 큽니다.", 413, errorHeaders);
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "X-Content-Type-Options": "nosniff",
        "X-Request-Id": requestId
      }
    });
  } catch {
    return imageError("이미지 프록시 처리 중 문제가 발생했습니다.", 500, errorHeaders);
  }
}
