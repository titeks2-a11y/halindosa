import { createJsonFeedNewsProvider } from "@/lib/deals/providers/newsProvider";

export const OfficialEventProvider = createJsonFeedNewsProvider({
  name: "official_event",
  source: "official_event_page_feed",
  envKeys: ["OFFICIAL_EVENT_FEED_URLS", "DEAL_EVENT_FEED_URLS"],
  includeSeed: true
});
