import deliveryPolicy from "@/data/notificationDeliveryPolicy.json";
import type { NotificationCampaignPriority } from "@/lib/notificationCampaigns";

export type NotificationDeliveryMode = "dry_run" | "live";

export interface NotificationDeliveryPolicyDecision {
  ok: boolean;
  mode: NotificationDeliveryMode;
  timezone: string;
  isQuietHours: boolean;
  maxTokens: number;
  tokenCount: number;
  nextAllowedAt: string;
  reasons: string[];
  warnings: string[];
}

export function getNotificationDeliveryPolicy() {
  return deliveryPolicy;
}

function getZonedHour(date: Date, timezone: string) {
  const value = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    hourCycle: "h23"
  }).format(date);

  return Number(value);
}

export function isNotificationQuietHour(date: Date, policy = deliveryPolicy) {
  const hour = getZonedHour(date, policy.timezone);
  const { startHour, endHour } = policy.quietHours;

  return startHour < endHour
    ? hour >= startHour && hour < endHour
    : hour >= startHour || hour < endHour;
}

export function getNextNotificationAllowedAt(date: Date, policy = deliveryPolicy) {
  if (!isNotificationQuietHour(date, policy)) return date.toISOString();

  const next = new Date(date);

  for (let attempt = 0; attempt < 36; attempt += 1) {
    next.setMinutes(next.getMinutes() + 30, 0, 0);
    if (!isNotificationQuietHour(next, policy)) return next.toISOString();
  }

  next.setUTCHours(next.getUTCHours() + 12, 0, 0, 0);
  return next.toISOString();
}

export function evaluateNotificationDelivery(input: {
  tokens: string[];
  dryRun?: boolean;
  priority?: NotificationCampaignPriority;
  scheduledAt?: string;
  confirmedConsent?: boolean;
  now?: Date;
}): NotificationDeliveryPolicyDecision {
  const policy = getNotificationDeliveryPolicy();
  const now = input.now ?? new Date();
  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : now;
  const mode: NotificationDeliveryMode = input.dryRun ? "dry_run" : "live";
  const tokenCount = input.tokens.length;
  const maxTokens = input.dryRun ? policy.maxTokensPerRequest.dryRun : policy.maxTokensPerRequest.live;
  const isQuietHours = isNotificationQuietHour(scheduledAt, policy);
  const reasons: string[] = [];
  const warnings: string[] = [];
  const priority = input.priority ?? "medium";
  const priorityRule = policy.priorityRules[priority];

  if (!tokenCount) reasons.push("no_tokens");
  if (tokenCount > maxTokens) reasons.push("token_limit_exceeded");
  if (!input.dryRun && policy.requiresExplicitConsent && !input.confirmedConsent) reasons.push("missing_explicit_consent");
  if (!input.dryRun && isQuietHours && !priorityRule.canBypassQuietHours) reasons.push("quiet_hours");
  if (input.dryRun && isQuietHours) warnings.push("dry_run_during_quiet_hours");
  if (!input.dryRun && policy.requiresDryRunBeforeLive && !input.confirmedConsent) reasons.push("dry_run_required_before_live");

  return {
    ok: reasons.length === 0,
    mode,
    timezone: policy.timezone,
    isQuietHours,
    maxTokens,
    tokenCount,
    nextAllowedAt: getNextNotificationAllowedAt(scheduledAt, policy),
    reasons,
    warnings
  };
}
