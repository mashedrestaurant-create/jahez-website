import { readFileSync, writeFileSync } from "fs";

const BRAND = "\u0686\u0627\u0647\u0650\u0632"; // چاهِز
// Match standalone جاهز not followed by ة (جاهزة) or ي (جاهزي)
const RE = /\u062C\u0627\u0647\u0632(?![\u0629\u064A])/g;

const files = [
  "app/site-frame.tsx",
  "app/about/page.tsx",
  "app/page.tsx",
  "app/contact/page.tsx",
  "app/menu/page.tsx",
  "app/locations/page.tsx",
  "app/language-context.tsx",
  "app/cart/page.tsx",
  "app/account/page.tsx",
  "app/error.tsx",
  "app/not-found.tsx",
  "app/global-error.tsx",
  "app/admin/login/page.tsx",
  "app/admin/layout.tsx",
  "app/admin/tabs/overview.tsx",
  "app/admin/tabs/orders.tsx",
  "app/driver/login/page.tsx",
  "app/driver/page.tsx",
];

let total = 0;
for (const f of files) {
  let src;
  try {
    src = readFileSync(f, "utf8");
  } catch {
    console.log("skip (missing):", f);
    continue;
  }
  const matches = src.match(RE);
  if (!matches) continue;
  src = src.replace(RE, BRAND);
  writeFileSync(f, src, "utf8");
  total += matches.length;
  console.log(`${f}: ${matches.length} replaced`);
}
console.log(`Total replaced: ${total}`);
