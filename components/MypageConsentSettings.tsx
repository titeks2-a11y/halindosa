"use client";

import { useState } from "react";
import { ConsentSettings } from "@/components/ConsentSettings";
import { ConsentState, readStoredConsent } from "@/lib/consent";

export function MypageConsentSettings() {
  const [consent, setConsent] = useState<ConsentState | null>(() => readStoredConsent());

  return <ConsentSettings consent={consent} onChange={setConsent} />;
}
