export const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@halindosa.com";

export function getSupportMailto(subject = "할인도사 문의") {
  return `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}`;
}
