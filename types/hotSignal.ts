import { DealCategory } from "@/types/deal";

export type HotSignalType = "news" | "community" | "rss";

export interface HotSignal {
  id: string;
  title: string;
  sourceName: string;
  /** Customer-safe internal discovery URL. Raw community/news source URLs must not be exposed here. */
  url: string;
  imageUrl?: string;
  publishedAt: string;
  summary: string;
  category: DealCategory | "전체";
  keywords: string[];
  signalType: HotSignalType;
  score: number;
}
