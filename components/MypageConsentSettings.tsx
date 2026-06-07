"use client";

import { useEffect, useState } from "react";
import { ConsentSettings } from "@/components/ConsentSettings";
import { ConsentState, readStoredConsent } from "@/lib/consent";

export function MypageConsentSettings() {
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setConsent(readStoredConsent());
    }, 0);

    return () => window.clearTimeout(handle);
  }, []);

  return <ConsentSettings consent={consent} onChange={setConsent} />;
}
