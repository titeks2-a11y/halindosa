import { NextResponse } from "next/server";

export const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0"
};

export function noStoreJson<T>(payload: T, init: ResponseInit = {}) {
  const headers = new Headers(noStoreHeaders);
  new Headers(init.headers).forEach((value, key) => {
    headers.set(key, value);
  });

  return NextResponse.json(payload, {
    ...init,
    headers
  });
}
