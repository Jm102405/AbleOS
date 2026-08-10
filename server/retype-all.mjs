// Applies the accessible type scale to one or more files.
// Usage: node server/retype-all.mjs <file> [file...]
//
// Plain string replacement, no regex. Order matters - larger sizes are
// remapped before smaller ones so nothing gets bumped twice.

import { readFileSync, writeFileSync } from "node:fs";

const files = process.argv.slice(2);

if (!files.length) {
  console.error("Usage: node server/retype-all.mjs <file> [file...]");
  process.exit(1);
}

const RULES = [
  // Sizes, biggest first so 9px does not become 14px and then 18px.
  ["text-[14px]", "text-[18px]"],
  ["text-[13px]", "text-[18px]"],
  ["text-[12px]", "text-[16px]"],
  ["text-[11px]", "text-[16px]"],
  ["text-[10px]", "text-[16px]"],
  ["text-[9px]", "text-[14px]"],

  // Mobile-first sizes now carry the design, so the sm: overrides are noise.
  [" sm:text-[18px]", ""],
  [" sm:text-[16px]", ""],
  [" sm:text-[14px]", ""],

  // Weights. 600 is kept for headings so hierarchy survives at 500 body.
  ["font-extrabold", "font-semibold"],
  ["font-bold", "font-medium"],

  // Uppercase costs about 40% more width and reads slower at 16px.
  [" uppercase", ""],
];

for (const file of files) {
  let source = readFileSync(file, "utf8");
  let total = 0;

  for (const [from, to] of RULES) {
    const hits = source.split(from).length - 1;
    if (!hits) continue;
    source = source.split(from).join(to);
    total += hits;
  }

  writeFileSync(file, source);
  console.log(`${total.toString().padStart(3)} replacements  ${file}`);
}

console.log("\nReview with: git diff");