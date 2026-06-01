import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const scanRoots = ["app", "components"];
const issues = [];

function collectTsxFiles(dir) {
  const items = readdirSync(dir);
  const files = [];

  for (const item of items) {
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

for (const base of scanRoots) {
  const files = collectTsxFiles(join(root, base));

  for (const file of files) {
    const body = readFileSync(file, "utf8");
    const relativePath = relative(root, file).replaceAll("\\", "/");
    const linkPattern = /<Link\b(?=[^>]*href=\{`\/deals\/)[^>]*>/gs;

    for (const match of body.matchAll(linkPattern)) {
      const tag = match[0];
      const line = lineNumber(body, match.index ?? 0);

      if (!tag.includes('target="_blank"')) {
        issues.push(`${relativePath}:${line} deal detail link must open in a new tab.`);
      }

      if (!tag.includes('rel="noopener noreferrer"')) {
        issues.push(`${relativePath}:${line} deal detail link must include noopener,noreferrer.`);
      }
    }
  }
}

if (issues.length) {
  console.error("Detail navigation doctor failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Detail navigation doctor passed.");
console.log("- Deal detail links in app/components open a new tab with noopener,noreferrer.");
