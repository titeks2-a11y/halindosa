import { Deal } from "@/types/deal";

const operationStore = globalThis as typeof globalThis & {
  __halindosaDealOperationOverrides?: DealOperationOverrides;
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

function getNodeStorage(): NodeStorage | null {
  const runtime = globalThis as typeof globalThis & {
    process?: {
      cwd?: () => string;
      getBuiltinModule?: (moduleName: string) => unknown;
      versions?: {
        node?: string;
      };
    };
  };

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
  const runtime = globalThis as typeof globalThis & {
    process?: {
      cwd?: () => string;
    };
  };
  const cwd = runtime.process?.cwd?.() ?? "";

  return storage.join(cwd, "data", "dealOperationOverrides.local.json");
}

function createEmptyOverrides(): DealOperationOverrides {
  return {
    hidden: {},
    auditLog: []
  };
}

function normalizeDealId(dealId: string) {
  return dealId.trim();
}

function normalizeOverrides(payload: Partial<DealOperationOverrides> = {}): DealOperationOverrides {
  return {
    hidden: payload.hidden ?? {},
    auditLog: Array.isArray(payload.auditLog) ? payload.auditLog.slice(0, 200) : []
  };
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

function writeDealOperationOverrides(overrides: DealOperationOverrides) {
  const normalized = normalizeOverrides(overrides);
  operationStore.__halindosaDealOperationOverrides = normalized;

  const storage = getNodeStorage();
  if (!storage) return;

  const overridePath = getOverridePath(storage);
  storage.mkdirSync(storage.dirname(overridePath), { recursive: true });
  storage.writeFileSync(overridePath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}

export function recordDealOperationAction(action: DealOperationAction, dealId: string, reason = "admin_operation") {
  const id = normalizeDealId(dealId);
  if (!id) return readDealOperationOverrides();

  const overrides = readDealOperationOverrides();
  const createdAt = new Date().toISOString();

  if (action === "hide") {
    overrides.hidden[id] = { reason, updatedAt: createdAt };
  }

  if (action === "restore") {
    delete overrides.hidden[id];
  }

  overrides.auditLog = [{ action, id, reason, createdAt }, ...overrides.auditLog].slice(0, 200);
  writeDealOperationOverrides(overrides);

  return readDealOperationOverrides();
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

export function getManualHiddenReason(dealId: string) {
  return readDealOperationOverrides().hidden[normalizeDealId(dealId)]?.reason ?? "admin_manual_hidden";
}

export function applyDealOperationOverrides<T extends Deal>(deal: T): T {
  if (!isDealManuallyHidden(deal.id)) return deal;

  const reason = getManualHiddenReason(deal.id);
  const updatedAt = readDealOperationOverrides().hidden[deal.id]?.updatedAt ?? new Date().toISOString();

  return {
    ...deal,
    isHidden: true,
    validationReason: deal.validationReason ? `${deal.validationReason}; ${reason}` : reason,
    validationStatus: "failed",
    lastCheckedAt: updatedAt,
    priorityScore: Math.min(deal.priorityScore ?? 0, 10),
    notice: "운영자가 링크, 재고, 가격 조건을 재검증 중인 특가입니다."
  };
}
