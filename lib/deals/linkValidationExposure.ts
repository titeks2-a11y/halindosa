import linkValidationExposureOverrides from "@/data/linkValidationExposureOverrides.json";
import type { Deal } from "@/types/deal";

interface LinkValidationExposureOverride {
  id: string;
  availability?: Deal["availability"];
  validationStatus?: Deal["validationStatus"];
  validationReason?: string;
  validationCode?: Deal["validationCode"];
  evidenceTier?: string;
  revalidationReason?: string;
}

const blockedItems = new Map<string, LinkValidationExposureOverride>(
  ((linkValidationExposureOverrides as { items?: LinkValidationExposureOverride[] }).items ?? []).map((item) => [item.id, item])
);

export function applyLinkValidationExposureOverride(deal: Deal): Deal {
  const blockedItem = blockedItems.get(deal.id);
  if (!blockedItem) return deal;

  const availability = blockedItem.availability === "sold_out" || blockedItem.availability === "ended" ? blockedItem.availability : "unknown";
  const validationReason =
    blockedItem.validationReason || blockedItem.revalidationReason || blockedItem.evidenceTier || "link_validation_report_blocked";

  return {
    ...deal,
    availability,
    validationStatus: "failed",
    validationReason,
    validationCode: blockedItem.validationCode && blockedItem.validationCode !== "valid" ? blockedItem.validationCode : "mismatch",
    isHidden: true,
    publishable: false,
    linkStatus: availability === "sold_out" ? "sold_out" : "needs_review",
    purchaseStatus: availability === "sold_out" ? "sold_out" : "needs_review",
    linkLabel: "운영 재검증 중",
    purchaseConfidence: Math.min(deal.purchaseConfidence ?? 0, 35),
    reliabilityScore: Math.min(deal.reliabilityScore ?? 0, 45)
  };
}
