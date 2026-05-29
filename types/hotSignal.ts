import { DealCategory } from "@/types/deal";

export type HotSignalType = "news" | "community" | "rss";

export interface HotSignal {
  id: string;
  title: string;
  sourceName: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  summary: string;
  category: DealCategory | "전체";
  keywords: string[];
  signalType: HotSignalType;
  score: number;
}
