"use client";

import { useEffect } from "react";

export function AuthDeepLinkHandler() {
  useEffect(() => {
    let removeListener: (() => Promise<void>) | undefined;

    async function setup() {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appUrlOpen", ({ url }) => {
          try {
            const parsed = new URL(url);
            if (parsed.hostname !== "auth" || parsed.pathname !== "/callback") return;
            window.location.href = `/auth/callback${parsed.search}${parsed.hash}`;
          } catch {
            // Ignore non-URL app events.
          }
        });
        removeListener = () => handle.remove();
      } catch {
        // Browser runtime does not need native deep-link handling.
      }
    }

    void setup();
    return () => {
      void removeListener?.();
    };
  }, []);

  return null;
}
