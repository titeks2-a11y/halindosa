import { createJsonFeedNewsProvider } from "@/lib/deals/providers/newsProvider";

export const EventNewsProvider = createJsonFeedNewsProvider({
  name: "event_news",
  source: "official_event_news_feed",
  envKeys: ["DEAL_EVENT_NEWS_FEED_URLS"],
  includeSeed: true
});
