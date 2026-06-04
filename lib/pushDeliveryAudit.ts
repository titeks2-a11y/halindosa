import type { NotificationDeliveryPolicyDecision } from "@/lib/notificationDeliveryPolicy";
import type { NotificationCampaignPriority } from "@/lib/notificationCampaigns";
import type { PushAlertType } from "@/lib/pushNotifications";

export interface PushDeliveryAuditInput {
  campaignId?: string;
  dealId?: string;
  benefitId?: string;
  sourceKind?: "product_deal" | "official_benefit";
  alertType?: PushAlertType;
  priority?: NotificationCampaignPriority;
  scheduledAt?: string;
  dryRun?: boolean;
  confirmedConsent?: boolean;
  tokenCount: number;
}

export interface PushDeliveryAuditEntry {
  eventId: string;
  createdAt: string;
  mode: "dry_run" | "live";
  status: "allowed" | "blocked" | "sent" | "failed";
  campaignId: string;
  dealId: string;
  benefitId: string;
  sourceKind: "product_deal" | "official_benefit";
  alertType: PushAlertType;
  priority: NotificationCampaignPriority;
  scheduledAt: string;
  tokenCount: number;
  attempted: number;
  sent: number;
  failed: number;
  confirmedConsent: boolean;
  blockedReasons: string[];
  policyWarnings: string[];
  nextAllowedAt: string;
  message: string;
}

function createAuditEventId(input: PushDeliveryAuditInput, createdAt: string) {
  const seed = [createdAt, input.campaignId, input.dealId, input.benefitId, input.alertType, input.tokenCount]
    .filter(Boolean)
    .join("-");

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return `push-audit-${hash.toString(16).padStart(8, "0")}`;
}

export function buildPushDeliveryAuditEntry(
  input: PushDeliveryAuditInput,
  result: {
    attempted: number;
    sent: number;
    failed: number;
    message: string;
    deliveryPolicy?: NotificationDeliveryPolicyDecision;
  }
): PushDeliveryAuditEntry {
  const createdAt = new Date().toISOString();
  const mode = input.dryRun ? "dry_run" : "live";
  const blockedReasons = result.deliveryPolicy?.reasons ?? [];
  const policyWarnings = result.deliveryPolicy?.warnings ?? [];
  const status: PushDeliveryAuditEntry["status"] = blockedReasons.length
    ? "blocked"
    : result.failed > 0
      ? "failed"
      : result.sent > 0
        ? "sent"
        : "allowed";

  return {
    eventId: createAuditEventId(input, createdAt),
    createdAt,
    mode,
    status,
    campaignId: input.campaignId ?? "",
    dealId: input.dealId ?? "",
    benefitId: input.benefitId ?? "",
    sourceKind: input.sourceKind ?? "product_deal",
    alertType: input.alertType ?? "deal",
    priority: input.priority ?? "medium",
    scheduledAt: input.scheduledAt ?? createdAt,
    tokenCount: input.tokenCount,
    attempted: result.attempted,
    sent: result.sent,
    failed: result.failed,
    confirmedConsent: Boolean(input.confirmedConsent),
    blockedReasons,
    policyWarnings,
    nextAllowedAt: result.deliveryPolicy?.nextAllowedAt ?? createdAt,
    message: result.message
  };
}

export function summarizePushDeliveryAudit(entries: PushDeliveryAuditEntry[]) {
  const blocked = entries.filter((entry) => entry.status === "blocked");
  const failed = entries.filter((entry) => entry.status === "failed");
  const live = entries.filter((entry) => entry.mode === "live");
  const dryRun = entries.filter((entry) => entry.mode === "dry_run");
  const reasonCounts = blocked.reduce<Record<string, number>>((counts, entry) => {
    for (const reason of entry.blockedReasons) counts[reason] = (counts[reason] ?? 0) + 1;
    return counts;
  }, {});

  return {
    totalEvents: entries.length,
    dryRunEvents: dryRun.length,
    liveEvents: live.length,
    blockedEvents: blocked.length,
    failedEvents: failed.length,
    sentTokens: entries.reduce((sum, entry) => sum + entry.sent, 0),
    failedTokens: entries.reduce((sum, entry) => sum + entry.failed, 0),
    blockedReasonCounts: reasonCounts
  };
}
