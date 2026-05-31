"use client";

import { getSupabaseBrowserClient } from "@/lib/auth/supabaseClient";
import { readRecentDealIds, recentDealStorageKey, rememberRecentDealId } from "@/lib/recentDeals";

export const favoriteStorageKey = "halindosa:favorites";
export const profileStorageKey = "halindosa:member-preferences";
const maxRecentDeals = 20;

export interface MemberPreferences {
  favoriteCategories: string[];
  marketingConsent: boolean;
  notificationConsent: boolean;
}

export const defaultMemberPreferences: MemberPreferences = {
  favoriteCategories: [],
  marketingConsent: false,
  notificationConsent: false
};

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)));
}

async function getCurrentUserId() {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error) return null;
  return data.user?.id ?? null;
}

export function readLocalFavoriteIds() {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(favoriteStorageKey);
    const parsed = stored ? (JSON.parse(stored) as unknown) : [];
    return Array.isArray(parsed) ? uniqueIds(parsed.filter((id): id is string => typeof id === "string")) : [];
  } catch {
    return [];
  }
}

export function writeLocalFavoriteIds(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(favoriteStorageKey, JSON.stringify(uniqueIds(ids)));
}

export function readLocalPreferences() {
  if (typeof window === "undefined") return defaultMemberPreferences;
  try {
    const stored = window.localStorage.getItem(profileStorageKey);
    return stored
      ? { ...defaultMemberPreferences, ...(JSON.parse(stored) as Partial<MemberPreferences>) }
      : defaultMemberPreferences;
  } catch {
    return defaultMemberPreferences;
  }
}

export function writeLocalPreferences(preferences: MemberPreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(profileStorageKey, JSON.stringify(preferences));
}

export async function fetchRemoteFavoriteIds() {
  const client = getSupabaseBrowserClient();
  const userId = await getCurrentUserId();
  if (!client || !userId) return null;

  const { data, error } = await client
    .from("user_favorite_deals")
    .select("deal_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return null;
  return uniqueIds((data ?? []).map((row) => String(row.deal_id)));
}

export async function syncFavoritesWithSupabase() {
  const client = getSupabaseBrowserClient();
  const userId = await getCurrentUserId();
  const localIds = readLocalFavoriteIds();
  if (!client || !userId) return localIds;

  if (localIds.length) {
    await client.from("user_favorite_deals").upsert(
      localIds.map((dealId) => ({
        user_id: userId,
        deal_id: dealId
      })),
      { onConflict: "user_id,deal_id" }
    );
  }

  const remoteIds = await fetchRemoteFavoriteIds();
  const next = uniqueIds([...(remoteIds ?? []), ...localIds]);
  writeLocalFavoriteIds(next);
  return next;
}

export async function toggleFavoriteSynced(dealId: string, currentIds: string[]) {
  const client = getSupabaseBrowserClient();
  const userId = await getCurrentUserId();
  const exists = currentIds.includes(dealId);
  const next = exists ? currentIds.filter((id) => id !== dealId) : uniqueIds([dealId, ...currentIds]);
  writeLocalFavoriteIds(next);

  if (client && userId) {
    if (exists) {
      await client.from("user_favorite_deals").delete().eq("user_id", userId).eq("deal_id", dealId);
    } else {
      await client.from("user_favorite_deals").upsert(
        {
          user_id: userId,
          deal_id: dealId
        },
        { onConflict: "user_id,deal_id" }
      );
    }
  }

  return next;
}

export async function fetchRemoteRecentDealIds(limit = maxRecentDeals) {
  const client = getSupabaseBrowserClient();
  const userId = await getCurrentUserId();
  if (!client || !userId) return null;

  const { data, error } = await client
    .from("user_recent_deals")
    .select("deal_id")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(limit);

  if (error) return null;
  return uniqueIds((data ?? []).map((row) => String(row.deal_id)));
}

export async function recordRecentDealView(dealId: string) {
  const localIds = rememberRecentDealId(dealId, maxRecentDeals);
  const client = getSupabaseBrowserClient();
  const userId = await getCurrentUserId();
  if (!client || !userId) return localIds;

  await client.from("user_recent_deals").upsert(
    {
      user_id: userId,
      deal_id: dealId,
      viewed_at: new Date().toISOString()
    },
    { onConflict: "user_id,deal_id" }
  );

  const remoteIds = await fetchRemoteRecentDealIds();
  return remoteIds ?? localIds;
}

export async function syncRecentDealsWithSupabase() {
  const client = getSupabaseBrowserClient();
  const userId = await getCurrentUserId();
  const localIds = readRecentDealIds();
  if (!client || !userId) return localIds;

  if (localIds.length) {
    const now = Date.now();
    await client.from("user_recent_deals").upsert(
      localIds.map((dealId, index) => ({
        user_id: userId,
        deal_id: dealId,
        viewed_at: new Date(now - index * 1000).toISOString()
      })),
      { onConflict: "user_id,deal_id" }
    );
  }

  const remoteIds = await fetchRemoteRecentDealIds();
  const next = remoteIds ?? localIds;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(recentDealStorageKey, JSON.stringify(next));
  }
  return next;
}

export async function clearRecentDealsSynced() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(recentDealStorageKey);
  }

  const client = getSupabaseBrowserClient();
  const userId = await getCurrentUserId();
  if (client && userId) {
    await client.from("user_recent_deals").delete().eq("user_id", userId);
  }
}

export async function fetchRemotePreferences() {
  const client = getSupabaseBrowserClient();
  const userId = await getCurrentUserId();
  if (!client || !userId) return null;

  const { data, error } = await client
    .from("user_profiles")
    .select("favorite_categories,marketing_consent,notification_consent")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    favoriteCategories: Array.isArray(data.favorite_categories) ? data.favorite_categories.map(String) : [],
    marketingConsent: Boolean(data.marketing_consent),
    notificationConsent: Boolean(data.notification_consent)
  } satisfies MemberPreferences;
}

export async function savePreferencesSynced(preferences: MemberPreferences, email?: string | null, nickname?: string) {
  writeLocalPreferences(preferences);
  const client = getSupabaseBrowserClient();
  const userId = await getCurrentUserId();
  if (!client || !userId) return;

  await client.from("user_profiles").upsert(
    {
      user_id: userId,
      email: email ?? "",
      nickname: nickname || email?.split("@")[0] || "할인도사 회원",
      favorite_categories: preferences.favoriteCategories,
      marketing_consent: preferences.marketingConsent,
      notification_consent: preferences.notificationConsent,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );
}
