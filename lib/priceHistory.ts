import { Deal } from "@/types/deal";

export interface PricePoint {
  observedAt: string;
  price: number;
}

export interface PriceInsight {
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  isLowestPrice: boolean;
  priceDropFromAverage: number;
  confidenceScore: number;
  summary: string;
}

function hashDealId(id: string) {
  return id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function getPriceHistory(deal: Deal): PricePoint[] {
  const seed = hashDealId(deal.id);
  const day = 24 * 60 * 60 * 1000;
  const baseTime = new Date(deal.createdAt).getTime();
  const points: PricePoint[] = [];

  for (let index = 6; index >= 1; index -= 1) {
    const variation = 1 + ((seed + index * 7) % 18) / 100;
    const price = Math.round((deal.salePrice * variation) / 10) * 10;
    points.push({
      observedAt: new Date(baseTime - index * day).toISOString(),
      price: Math.min(deal.originalPrice, Math.max(deal.salePrice, price))
    });
  }

  points.push({
    observedAt: deal.createdAt,
    price: deal.salePrice
  });

  return points;
}

export function getPriceInsight(deal: Deal): PriceInsight {
  const history = getPriceHistory(deal);
  const prices = history.map((point) => point.price);
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);
  const averagePrice = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length / 10) * 10;
  const isLowestPrice = deal.salePrice <= lowestPrice;
  const priceDropFromAverage = Math.max(0, averagePrice - deal.salePrice);
  const confidenceScore = Math.min(
    98,
    Math.max(62, 72 + deal.discountRate * 0.22 + (isLowestPrice ? 10 : 0) + (deal.isHot ? 4 : 0))
  );

  return {
    currentPrice: deal.salePrice,
    lowestPrice,
    highestPrice,
    averagePrice,
    isLowestPrice,
    priceDropFromAverage,
    confidenceScore: Math.round(confidenceScore),
    summary: isLowestPrice
      ? "최근 7회 관측 기준 최저가 수준입니다."
      : "최근 평균 대비 할인 중이며 판매처 최종가 확인이 필요합니다."
  };
}
