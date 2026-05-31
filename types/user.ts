export interface HalindosaUserProfile {
  userId: string;
  email: string;
  nickname: string;
  createdAt: string;
  favoriteCategories: string[];
  marketingConsent: boolean;
  notificationConsent: boolean;
}

export interface UserFavoriteDeal {
  userId: string;
  dealId: string;
  createdAt: string;
}

export interface UserRecentDeal {
  userId: string;
  dealId: string;
  viewedAt: string;
}

export interface DealClickLog {
  id: string;
  userId?: string;
  dealId: string;
  from: string;
  finalPurchaseUrl: string;
  createdAt: string;
}
