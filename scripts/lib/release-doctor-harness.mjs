import { existsSync, readFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const root = process.cwd();
export const checks = [];

export function pass(name, detail = "") {
  checks.push({ name, ok: true, detail });
}

export function fail(name, detail) {
  checks.push({ name, ok: false, detail });
}

export async function text(path) {
  return readFile(join(root, path), "utf8");
}

export function fileSize(path) {
  const fullPath = join(root, path);
  return existsSync(fullPath) ? statSync(fullPath).size : 0;
}

export function run(command, args) {
  try {
    return execFileSync(command, args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

export function withQaRunnerScripts(pkg) {
  const qaRunnerPath = join(root, "scripts/run-qa.mjs");
  const qaRunner = existsSync(qaRunnerPath) ? readFileSync(qaRunnerPath, "utf8") : "";
  const scripts = { ...(pkg.scripts ?? {}) };
  scripts.qa = `${scripts.qa ?? ""}\n${qaRunner}`;
  scripts["qa:release"] = `${scripts["qa:release"] ?? ""}\n${qaRunner}`;
  return { ...pkg, scripts };
}
