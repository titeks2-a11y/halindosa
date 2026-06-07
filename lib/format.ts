export function formatPrice(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(value);
}

type ReferenceTime = number | string | Date;

function getReferenceTime(referenceTime?: ReferenceTime) {
  if (referenceTime instanceof Date) return referenceTime.getTime();
  if (typeof referenceTime === "string") return new Date(referenceTime).getTime();
  if (typeof referenceTime === "number") return referenceTime;
  return Date.now();
}

export function getRelativeTime(isoDate: string, referenceTime?: ReferenceTime) {
  const diffMs = getReferenceTime(referenceTime) - new Date(isoDate).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  return `${Math.floor(hours / 24)}일 전`;
}

export function getTimeLeft(isoDate: string, referenceTime?: ReferenceTime) {
  const diffMs = new Date(isoDate).getTime() - getReferenceTime(referenceTime);

  if (diffMs <= 0) return "마감";

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}일 ${hours % 24}시간 남음`;
  if (hours > 0) return `${hours}시간 ${minutes % 60}분 남음`;
  return `${minutes}분 남음`;
}
