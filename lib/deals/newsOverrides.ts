import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { NewsDeal } from "@/types/newsDeal";

export type NewsOverrideAction = "hide" | "restore" | "revalidate";

export interface NewsDealOverrideEntry {
  reason: string;
  updatedAt: string;
}

export interface NewsDealOverrideLog {
  action: NewsOverrideAction;
  id: string;
  reason: string;
  createdAt: string;
}

export interface NewsDealOverrides {
  hidden: Record<string, NewsDealOverrideEntry>;
  auditLog: NewsDealOverrideLog[];
}

const overridePath = join(process.cwd(), "data", "newsDealOverrides.local.json");

function createEmptyOverrides(): NewsDealOverrides {
  return {
    hidden: {},
    auditLog: []
  };
}

export function readNewsDealOverrides(): NewsDealOverrides {
  if (!existsSync(overridePath)) return createEmptyOverrides();

  try {
    const payload = JSON.parse(readFileSync(overridePath, "utf8")) as Partial<NewsDealOverrides>;
    return {
      hidden: payload.hidden ?? {},
      auditLog: Array.isArray(payload.auditLog) ? payload.auditLog.slice(0, 200) : []
    };
  } catch {
    return createEmptyOverrides();
  }
}

function writeNewsDealOverrides(overrides: NewsDealOverrides) {
  mkdirSync(dirname(overridePath), { recursive: true });
  writeFileSync(overridePath, `${JSON.stringify(overrides, null, 2)}\n`, "utf8");
}

export function applyNewsDealOverrides(deals: NewsDeal[]) {
  const overrides = readNewsDealOverrides();

  return deals
    .map((deal) => {
      const hidden = overrides.hidden[deal.id];
      if (!hidden) return deal;

      return {
        ...deal,
        validationStatus: "failed" as const,
        isHidden: true,
        hiddenReason: `manual_hidden:${hidden.reason}`,
        lastCheckedAt: hidden.updatedAt
      };
    })
    .filter((deal) => !deal.isHidden);
}

export function recordNewsOverrideAction(action: NewsOverrideAction, id: string, reason = "admin_operation") {
  const overrides = readNewsDealOverrides();
  const createdAt = new Date().toISOString();

  if (action === "hide") {
    overrides.hidden[id] = { reason, updatedAt: createdAt };
  }

  if (action === "restore") {
    delete overrides.hidden[id];
  }

  overrides.auditLog = [{ action, id, reason, createdAt }, ...overrides.auditLog].slice(0, 200);
  writeNewsDealOverrides(overrides);

  return readNewsDealOverrides();
}
