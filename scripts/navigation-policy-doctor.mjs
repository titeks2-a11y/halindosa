import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const scanRoots = ["app", "components"];
const issues = [];

function collectTsxFiles(dir) {
  const files = [];

  for (const item of readdirSync(dir)) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...collectTsxFiles(fullPath));
    } else if (item.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

function lineNumber(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function requireBlankSafety(tag, relativePath, line, label) {
  if (!tag.includes('target="_blank"')) {
    issues.push(`${relativePath}:${line} ${label} must open in a new tab.`);
  }

  if (!tag.includes('rel="noopener noreferrer"')) {
    issues.push(`${relativePath}:${line} ${label} must include rel="noopener noreferrer".`);
  }
}

for (const base of scanRoots) {
  const files = collectTsxFiles(join(root, base));

  for (const file of files) {
    const body = readFileSync(file, "utf8");
    const relativePath = relative(root, file).replaceAll("\\", "/");

    for (const pattern of [/href=["']#["']/g, /href=\{["']#["']\}/g, /javascript:void/gi]) {
      for (const match of body.matchAll(pattern)) {
        issues.push(`${relativePath}:${lineNumber(body, match.index ?? 0)} placeholder/hash/javascript links are not allowed in launch UI.`);
      }
    }

    for (const match of body.matchAll(/<(Link|a)\b[^>]*target="_blank"[^>]*>/gs)) {
      const tag = match[0];
      const line = lineNumber(body, match.index ?? 0);
      if (!tag.includes('rel="noopener noreferrer"')) {
        issues.push(`${relativePath}:${line} target="_blank" links must include rel="noopener noreferrer".`);
      }
    }

    for (const match of body.matchAll(/<Link\b(?=[^>]*href=\{?`?["']?\/deals\/)[^>]*>/gs)) {
      requireBlankSafety(match[0], relativePath, lineNumber(body, match.index ?? 0), "deal detail links");
    }

    for (const match of body.matchAll(/<a\b(?=[^>]*href=\{?`?["']?\/go\/)[^>]*>/gs)) {
      requireBlankSafety(match[0], relativePath, lineNumber(body, match.index ?? 0), "tracked purchase links");
    }

    for (const match of body.matchAll(/window\.open\((?<args>[\s\S]*?)\);/g)) {
      const args = match.groups?.args ?? "";
      const line = lineNumber(body, match.index ?? 0);
      if (!args.includes('"_blank"') && !args.includes("'_blank'")) {
        issues.push(`${relativePath}:${line} window.open purchase/external navigation must use _blank.`);
      }
      if (!args.includes('"noopener,noreferrer"') && !args.includes("'noopener,noreferrer'")) {
        issues.push(`${relativePath}:${line} window.open purchase/external navigation must include noopener,noreferrer.`);
      }
    }
  }
}

if (issues.length) {
  console.error("Navigation policy doctor failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Navigation policy doctor passed.");
console.log("- No placeholder, hash-only, or javascript:void links in app/components.");
console.log("- Deal detail and tracked purchase links keep new-tab noopener/noreferrer policy.");
console.log("- window.open calls keep _blank noopener,noreferrer policy.");
