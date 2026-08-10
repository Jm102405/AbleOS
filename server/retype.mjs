// One-off: apply the accessible type scale to a file.
// Usage: node server/retype.mjs src/pages/RajCockpit.tsx
//
// Plain string replacement, no regex, so brackets and hashes in Tailwind
// arbitrary values are safe. Reports anything it could not find.

import { readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2];

if (!file) {
  console.error("Usage: node server/retype.mjs <file>");
  process.exit(1);
}

const PAIRS = [
  // Nav pills
  [
    "py-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#1E3A8A]",
    "py-2 text-[16px] font-medium text-[#1E3A8A]",
  ],
  [
    "py-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white/80",
    "py-2 text-[16px] font-medium text-white/80",
  ],

  // Assign Task button, now 48px tall
  [
    "px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-[#2F6FD8]",
    "px-5 py-3 text-[16px] font-medium text-white transition-colors hover:bg-[#2F6FD8]",
  ],
  ["focus:ring-offset-2 sm:text-[12px]", "focus:ring-offset-2"],

  // Order list states
  [
    '<p className="text-[12px] font-medium text-[#8A99AC]">',
    '<p className="text-[16px] font-normal text-[#8A99AC]">',
  ],
  [
    "text-[12px] font-bold leading-snug text-[#D95717]",
    "text-[16px] font-medium leading-[1.5] text-[#D95717]",
  ],
  [
    "mt-2 text-[11px] font-extrabold uppercase tracking-wide text-[#418BFF] hover:underline",
    "mt-2 text-[16px] font-medium text-[#418BFF] hover:underline",
  ],
  [
    "text-[12px] font-medium leading-snug text-[#8A99AC]",
    "text-[16px] font-normal leading-[1.5] text-[#8A99AC]",
  ],

  // Order card
  [
    "text-[13px] font-extrabold leading-snug tracking-[-0.015em] text-[#1A1A2E] sm:text-[14px]",
    "text-[18px] font-medium leading-[1.4] tracking-[-0.01em] text-[#1A1A2E]",
  ],
  [
    "px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide",
    "px-2.5 py-1 text-[14px] font-medium",
  ],
  [
    "mt-1 text-[11px] font-medium leading-snug text-[#6B7A90] sm:text-[12px]",
    "mt-1 text-[16px] font-normal leading-[1.5] text-[#6B7A90]",
  ],

  // Footer
  [
    "pt-10 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#8291A5]",
    "pt-10 text-center text-[16px] font-normal text-[#8291A5]",
  ],

  // Toast
  [
    "text-[12px] font-bold text-white sm:text-[13px]",
    "text-[16px] font-medium text-white",
  ],

  // Approval modal
  [
    "mt-3 whitespace-pre-line text-[12px] font-medium leading-relaxed text-[#526176]",
    "mt-3 whitespace-pre-line text-[16px] font-normal leading-[1.6] text-[#526176]",
  ],
  ["mb-3 text-[11px] font-bold text-red-500", "mb-3 text-[16px] font-medium text-red-500"],
  [
    "px-4 py-2.5 text-[12px] font-extrabold uppercase tracking-wide text-[#526176]",
    "px-5 py-3 text-[16px] font-medium text-[#526176]",
  ],
  [
    "px-4 py-2.5 text-[12px] font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-[#15803D]",
    "px-5 py-3 text-[16px] font-medium text-white transition-colors hover:bg-[#15803D]",
  ],
  [
    '<dt className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#8A99AC]">',
    '<dt className="text-[16px] font-normal text-[#8A99AC]">',
  ],
  [
    '<dd className="text-[12px] font-bold text-[#1A1A2E]">{value}</dd>',
    '<dd className="text-[16px] font-medium text-[#1A1A2E]">{value}</dd>',
  ],
];

let source = readFileSync(file, "utf8");
let total = 0;

for (const [from, to] of PAIRS) {
  const hits = source.split(from).length - 1;

  if (hits === 0) {
    console.log("MISS  ", from.slice(0, 60));
    continue;
  }

  source = source.split(from).join(to);
  total += hits;
  console.log(`ok x${hits} `, from.slice(0, 60));
}

writeFileSync(file, source);
console.log("\nTotal replacements:", total);