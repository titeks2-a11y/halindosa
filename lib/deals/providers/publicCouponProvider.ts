import { createJsonFeedNewsProvider } from "@/lib/deals/providers/newsProvider";

export const PublicCouponProvider = createJsonFeedNewsProvider({
  name: "public_coupon",
  source: "public_coupon_and_culture_benefit_feed",
  envKeys: ["PUBLIC_COUPON_FEED_URLS", "BENEFIT_REFRESH_FEED_URLS"],
  includeSeed: true
});
