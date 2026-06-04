import { evaluateNotificationDelivery, type NotificationDeliveryPolicyDecision } from "@/lib/notificationDeliveryPolicy";
import type { NotificationCampaignPriority } from "@/lib/notificationCampaigns";
import { buildPushDeliveryAuditEntry, type PushDeliveryAuditEntry } from "@/lib/pushDeliveryAudit";

export type PushAlertType =
  | "deal"
  | "deal_registered"
  | "freebie"
  | "free_event"
  | "price_drop"
  | "ending_soon"
  | "interest_category";

export interface PushSendInput {
  title: string;
  body: string;
  tokens: string[];
  dealId?: string;
  benefitId?: string;
  campaignId?: string;
  sourceKind?: "product_deal" | "official_benefit";
  alertType?: PushAlertType;
  priority?: NotificationCampaignPriority;
  scheduledAt?: string;
  confirmedConsent?: boolean;
  dryRun?: boolean;
}

export interface PushSendResult {
  configured: boolean;
  attempted: number;
  sent: number;
  failed: number;
  message: string;
  deliveryPolicy?: NotificationDeliveryPolicyDecision;
  deliveryAudit?: PushDeliveryAuditEntry;
}

function getFcmServerKey() {
  return process.env.FCM_SERVER_KEY?.trim() || "";
}

export function getPushReadiness() {
  const enabled = process.env.PUSH_SEND_ENABLED === "true";
  const hasServerKey = Boolean(getFcmServerKey());

  return {
    enabled,
    hasServerKey,
    configured: enabled && hasServerKey,
    requiredEnv: ["PUSH_SEND_ENABLED=true", "FCM_SERVER_KEY"]
  };
}

function normalizeTokens(tokens: string[]) {
  return Array.from(new Set(tokens.map((token) => token.trim()).filter(Boolean))).slice(0, 500);
}

export async function sendPushNotification(input: PushSendInput): Promise<PushSendResult> {
  const tokens = normalizeTokens(input.tokens);
  const readiness = getPushReadiness();
  const deliveryPolicy = evaluateNotificationDelivery({
    tokens,
    dryRun: input.dryRun,
    priority: input.priority,
    scheduledAt: input.scheduledAt,
    confirmedConsent: input.confirmedConsent
  });
  const withDeliveryAudit = (result: Omit<PushSendResult, "deliveryAudit">): PushSendResult => ({
    ...result,
    deliveryAudit: buildPushDeliveryAuditEntry(
      {
        campaignId: input.campaignId,
        dealId: input.dealId,
        benefitId: input.benefitId,
        sourceKind: input.sourceKind,
        alertType: input.alertType,
        priority: input.priority,
        scheduledAt: input.scheduledAt,
        dryRun: input.dryRun,
        confirmedConsent: input.confirmedConsent,
        tokenCount: tokens.length
      },
      result
    )
  });

  if (!tokens.length) {
    return withDeliveryAudit({
      configured: readiness.configured,
      attempted: 0,
      sent: 0,
      failed: 0,
      message: "발송 대상 토큰이 없습니다.",
      deliveryPolicy
    });
  }

  if (!deliveryPolicy.ok) {
    return withDeliveryAudit({
      configured: readiness.configured,
      attempted: tokens.length,
      sent: 0,
      failed: tokens.length,
      message: `알림 발송 정책으로 차단되었습니다: ${deliveryPolicy.reasons.join(", ")}`,
      deliveryPolicy
    });
  }

  if (input.dryRun) {
    return withDeliveryAudit({
      configured: readiness.configured,
      attempted: tokens.length,
      sent: 0,
      failed: 0,
      message: "dry-run으로 발송 대상만 검증했습니다.",
      deliveryPolicy
    });
  }

  if (!readiness.configured) {
    return withDeliveryAudit({
      configured: false,
      attempted: tokens.length,
      sent: 0,
      failed: tokens.length,
      message: "FCM 발송 환경변수가 설정되지 않았습니다.",
      deliveryPolicy
    });
  }

  const response = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: `key=${getFcmServerKey()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      registration_ids: tokens,
      notification: {
        title: input.title,
        body: input.body
      },
      data: {
        dealId: input.dealId ?? "",
        benefitId: input.benefitId ?? "",
        campaignId: input.campaignId ?? "",
        alertType: input.alertType ?? "deal",
        sourceKind: input.sourceKind ?? "product_deal",
        scheduledAt: input.scheduledAt ?? "",
        nextAllowedAt: deliveryPolicy.nextAllowedAt,
        source: "halindosa"
      }
    })
  });

  if (!response.ok) {
    return withDeliveryAudit({
      configured: true,
      attempted: tokens.length,
      sent: 0,
      failed: tokens.length,
      message: `FCM 요청 실패: ${response.status}`,
      deliveryPolicy
    });
  }

  const payload = (await response.json().catch(() => ({}))) as { success?: number; failure?: number };
  const sent = Number(payload.success ?? 0);
  const failed = Number(payload.failure ?? Math.max(tokens.length - sent, 0));

  return withDeliveryAudit({
    configured: true,
    attempted: tokens.length,
    sent,
    failed,
    message: "FCM 발송 요청을 처리했습니다.",
    deliveryPolicy
  });
}
