import { Deal } from "@/types/deal";

const operationStore = globalThis as typeof globalThis & {
  __halindosaDealOperationOverrides?: DealOperationOverrides;
  __halindosaDealOperationOverridesLiveCache?: {
    overrides: DealOperationOverrides;
    readAt: number;
  };
};

export type DealOperationAction = "hide" | "restore" | "revalidate";

export interface DealOperationOverrideEntry {
  reason: string;
  updatedAt: string;
}

export interface DealOperationOverrideLog {
  action: DealOperationAction;
  id: string;
  reason: string;
  createdAt: string;
}

export interface DealOperationOverrides {
  hidden: Record<string, DealOperationOverrideEntry>;
  revalidate: Record<string, DealOperationOverrideEntry>;
  auditLog: DealOperationOverrideLog[];
}

interface NodeStorage {
  existsSync: (path: string) => boolean;
  mkdirSync: (path: string, options?: { recursive?: boolean }) => void;
  readFileSync: (path: string, encoding: BufferEncoding) => string;
  writeFileSync: (path: string, data: string, encoding: BufferEncoding) => void;
  dirname: (path: string) => string;
  join: (...paths: string[]) => string;
}

interface ServerRuntime {
  process?: {
    cwd?: () => string;
    env?: Record<string, string | undefined>;
    getBuiltinModule?: (moduleName: string) => unknown;
    versions?: {
      node?: string;
    };
  };
}

function getNodeStorage(): NodeStorage | null {
  const runtime = globalThis as typeof globalThis & ServerRuntime;

  if (!runtime.process?.versions?.node || typeof window !== "undefined") {
    return null;
  }

  try {
    const fs = runtime.process.getBuiltinModule?.("fs") as Pick<NodeStorage, "existsSync" | "mkdirSync" | "readFileSync" | "writeFileSync"> | undefined;
    const path = runtime.process.getBuiltinModule?.("path") as Pick<NodeStorage, "dirname" | "join"> | undefined;
    if (!fs || !path) return null;

    return {
      existsSync: fs.existsSync,
      mkdirSync: fs.mkdirSync,
      readFileSync: fs.readFileSync,
      writeFileSync: fs.writeFileSync,
      dirname: path.dirname,
      join: path.join
    };
  } catch {
    return null;
  }
}

function getOverridePath(storage: NodeStorage) {
  const runtime = globalThis as typeof globalThis & ServerRuntime;
  const cwd = runtime.process?.cwd?.() ?? "";

  return storage.join(cwd, "data", "dealOperationOverrides.local.json");
}

function getServerEnv() {
  const runtime = globalThis as typeof globalThis & ServerRuntime;
  if (!runtime.process?.versions?.node || typeof window !== "undefined") return null;

  return runtime.process.env ?? null;
}

function createEmptyOverrides(): DealOperationOverrides {
  return {
    hidden: {},
    revalidate: {},
    auditLog: []
  };
}

function normalizeDealId(dealId: string) {
  return dealId.trim();
}

function normalizeOverrides(payload: Partial<DealOperationOverrides> = {}): DealOperationOverrides {
  return {
    hidden: payload.hidden ?? {},
    revalidate: payload.revalidate ?? {},
    auditLog: Array.isArray(payload.auditLog) ? payload.auditLog.slice(0, 200) : []
  };
}

function normalizeAction(action: string): DealOperationAction | null {
  if (action === "hide" || action === "deal_hide" || action === "manual_hide") return "hide";
  if (action === "restore" || action === "deal_restore" || action === "manual_restore") return "restore";
  if (action === "revalidate" || action === "deal_revalidate") return "revalidate";
  return null;
}

function mergeDealOperationOverrides(...overrideGroups: DealOperationOverrides[]): DealOperationOverrides {
  const auditLog = overrideGroups
    .flatMap((overrides) => overrides.auditLog)
    .filter((item) => item.id && item.action)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 200);
  const hidden: DealOperationOverrides["hidden"] = {};
  const revalidate: DealOperationOverrides["revalidate"] = {};
  const resolved = new Set<string>();

  for (const item of auditLog) {
    if (resolved.has(item.id)) continue;
    resolved.add(item.id);

    if (item.action === "hide") {
      hidden[item.id] = {
        reason: item.reason || "admin_manual_hidden",
        updatedAt: item.createdAt
      };
    }

    if (item.action === "revalidate") {
      revalidate[item.id] = {
        reason: item.reason || "report_revalidate",
        updatedAt: item.createdAt
      };
    }
  }

  for (const overrides of overrideGroups) {
    for (const [id, entry] of Object.entries(overrides.hidden)) {
      if (!resolved.has(id)) {
        hidden[id] = entry;
      }
    }

    for (const [id, entry] of Object.entries(overrides.revalidate)) {
      if (!resolved.has(id) && !hidden[id]) {
        revalidate[id] = entry;
      }
    }
  }

  return { hidden, revalidate, auditLog };
}

export function readDealOperationOverrides(): DealOperationOverrides {
  if (operationStore.__halindosaDealOperationOverrides) {
    return normalizeOverrides(operationStore.__halindosaDealOperationOverrides);
  }

  const storage = getNodeStorage();
  if (!storage) {
    const empty = createEmptyOverrides();
    operationStore.__halindosaDealOperationOverrides = empty;
    return empty;
  }

  try {
    const overridePath = getOverridePath(storage);
    if (!storage.existsSync(overridePath)) {
      const empty = createEmptyOverrides();
      operationStore.__halindosaDealOperationOverrides = empty;
      return empty;
    }

    const payload = JSON.parse(storage.readFileSync(overridePath, "utf8")) as Partial<DealOperationOverrides>;
    const overrides = normalizeOverrides(payload);
    operationStore.__halindosaDealOperationOverrides = overrides;
    return overrides;
  } catch {
    const empty = createEmptyOverrides();
    operationStore.__halindosaDealOperationOverrides = empty;
    return empty;
  }
}

function getSupabaseAdminActionsConfig() {
  const env = getServerEnv();
  const url = env?.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const serviceKey = env?.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return { url, serviceKey };
}

export function getDealOperationOverrideStorageStatus() {
  const storage = getNodeStorage();
  const overridePath = storage ? getOverridePath(storage) : "";

  return {
    localFile: Boolean(storage && overridePath && storage.existsSync(overridePath)),
    localPath: overridePath,
    supabaseConfigured: Boolean(getSupabaseAdminActionsConfig()),
    supabaseTable: "admin_actions"
  };
}

async function fetchSupabaseDealOperationOverrides(): Promise<DealOperationOverrides> {
  const config = getSupabaseAdminActionsConfig();
  if (!config) return createEmptyOverrides();

  try {
    const endpoint =
      `${config.url}/rest/v1/admin_actions` +
      "?select=action_type,deal_id,reason,created_at" +
      "&deal_id=not.is.null" +
      "&action_type=in.(deal_hide,deal_restore,deal_revalidate,hide,restore,revalidate,manual_hide,manual_restore)" +
      "&order=created_at.desc" +
      "&limit=200";
    const response = await fetch(endpoint, {
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`
      },
      cache: "no-store"
    });

    if (!response.ok) return createEmptyOverrides();

    const rows = (await response.json()) as Array<{
      action_type?: string;
      deal_id?: string;
      reason?: string;
      created_at?: string;
    }>;
    const auditLog = rows
      .map((row) => {
        const action = normalizeAction(row.action_type ?? "");
        if (!action || !row.deal_id) return null;

        return {
          action,
          id: row.deal_id,
          reason: row.reason || "supabase_admin_action",
          createdAt: row.created_at || new Date().toISOString()
        } satisfies DealOperationOverrideLog;
      })
      .filter((item): item is DealOperationOverrideLog => Boolean(item));

    return mergeDealOperationOverrides({ hidden: {}, revalidate: {}, auditLog });
  } catch {
    return createEmptyOverrides();
  }
}

export async function readDealOperationOverridesLive(): Promise<DealOperationOverrides> {
  const now = Date.now();
  const cache = operationStore.__halindosaDealOperationOverridesLiveCache;

  if (cache && now - cache.readAt < 10_000) {
    return normalizeOverrides(cache.overrides);
  }

  const localOverrides = readDealOperationOverrides();
  const supabaseOverrides = await fetchSupabaseDealOperationOverrides();
  const merged = mergeDealOperationOverrides(supabaseOverrides, localOverrides);

  operationStore.__halindosaDealOperationOverrides = merged;
  operationStore.__halindosaDealOperationOverridesLiveCache = {
    overrides: merged,
    readAt: now
  };

  return merged;
}

function writeDealOperationOverrides(overrides: DealOperationOverrides) {
  const normalized = normalizeOverrides(overrides);
  operationStore.__halindosaDealOperationOverrides = normalized;

  const storage = getNodeStorage();
  if (!storage) return;

  const overridePath = getOverridePath(storage);
  storage.mkdirSync(storage.dirname(overridePath), { recursive: true });
  storage.writeFileSync(overridePath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}

async function writeSupabaseDealOperationAction(action: DealOperationAction, dealId: string, reason: string) {
  const config = getSupabaseAdminActionsConfig();
  if (!config) return false;

  try {
    const createdAt = new Date().toISOString();
    const response = await fetch(`${config.url}/rest/v1/admin_actions`, {
      method: "POST",
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        action_type: `deal_${action}`,
        deal_id: dealId,
        reason,
        before_state: {},
        after_state: {
          operation: action,
          source: "halindosa_admin",
          localFallback: true
        },
        created_at: createdAt
      })
    });

    return response.ok;
  } catch {
    return false;
  }
}

export function recordDealOperationAction(action: DealOperationAction, dealId: string, reason = "admin_operation") {
  const id = normalizeDealId(dealId);
  if (!id) return readDealOperationOverrides();

  const overrides = readDealOperationOverrides();
  const createdAt = new Date().toISOString();

  if (action === "hide") {
    overrides.hidden[id] = { reason, updatedAt: createdAt };
    delete overrides.revalidate[id];
  }

  if (action === "restore") {
    delete overrides.hidden[id];
    delete overrides.revalidate[id];
  }

  if (action === "revalidate" && !overrides.hidden[id]) {
    overrides.revalidate[id] = { reason, updatedAt: createdAt };
  }

  overrides.auditLog = [{ action, id, reason, createdAt }, ...overrides.auditLog].slice(0, 200);
  writeDealOperationOverrides(overrides);
  operationStore.__halindosaDealOperationOverridesLiveCache = undefined;

  return readDealOperationOverrides();
}

export async function recordDealOperationActionWithPersistence(action: DealOperationAction, dealId: string, reason = "admin_operation") {
  const localOverrides = recordDealOperationAction(action, dealId, reason);
  await writeSupabaseDealOperationAction(action, normalizeDealId(dealId), reason);
  operationStore.__halindosaDealOperationOverridesLiveCache = undefined;

  return mergeDealOperationOverrides(await fetchSupabaseDealOperationOverrides(), localOverrides);
}

export function hideDealManually(dealId: string, reason = "admin_manual_hidden") {
  const id = normalizeDealId(dealId);
  if (!id) return false;

  recordDealOperationAction("hide", id, reason);
  return true;
}

export function restoreDealManually(dealId: string) {
  const id = normalizeDealId(dealId);
  if (!id) return false;

  const wasHidden = isDealManuallyHidden(id);
  recordDealOperationAction("restore", id, "admin_restore");
  return wasHidden;
}

export function isDealManuallyHidden(dealId: string) {
  return Boolean(readDealOperationOverrides().hidden[normalizeDealId(dealId)]);
}

export function listManualHiddenDealIds() {
  return Object.keys(readDealOperationOverrides().hidden).sort();
}

export function listRevalidationDealIds() {
  return Object.entries(readDealOperationOverrides().revalidate)
    .sort((a, b) => new Date(b[1].updatedAt).getTime() - new Date(a[1].updatedAt).getTime())
    .map(([id]) => id);
}

export function getManualHiddenReason(dealId: string) {
  return readDealOperationOverrides().hidden[normalizeDealId(dealId)]?.reason ?? "admin_manual_hidden";
}

export function getRevalidationReason(dealId: string) {
  return readDealOperationOverrides().revalidate[normalizeDealId(dealId)]?.reason ?? "report_revalidate";
}

export function applyDealOperationOverrides<T extends Deal>(deal: T, overrides = readDealOperationOverrides()): T {
  const id = normalizeDealId(deal.id);
  const hiddenEntry = overrides.hidden[id];
  const revalidationEntry = overrides.revalidate[id];
  if (!hiddenEntry && !revalidationEntry) return deal;

  if (!hiddenEntry && revalidationEntry) {
    const reason = revalidationEntry.reason || getRevalidationReason(deal.id);
    return {
      ...deal,
      validationReason: deal.validationReason ? `${deal.validationReason}; ${reason}` : reason,
      priorityScore: Math.max(deal.priorityScore ?? 0, 92),
      reportCount: Math.max(deal.reportCount ?? 0, 1),
      notice: "사용자 신고가 접수되어 운영자가 링크, 재고, 가격 조건을 우선 재검증 중입니다."
    };
  }

  const reason = hiddenEntry.reason || getManualHiddenReason(deal.id);
  const updatedAt = hiddenEntry.updatedAt ?? new Date().toISOString();

  return {
    ...deal,
    isHidden: true,
    validationCode: "hidden",
    publishable: false,
    validationReason: deal.validationReason ? `${deal.validationReason}; ${reason}` : reason,
    validationStatus: "failed",
    lastCheckedAt: updatedAt,
    priorityScore: Math.min(deal.priorityScore ?? 0, 10),
    notice: "운영자가 링크, 재고, 가격 조건을 재검증 중인 특가입니다."
  };
}
