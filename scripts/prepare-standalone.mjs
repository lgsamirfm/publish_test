import { cp, mkdir } from "node:fs/promises";

await mkdir(".next/standalone/.next", { recursive: true });
await Promise.all([
  cp("public", ".next/standalone/public", { recursive: true, force: true }),
  cp(".next/static", ".next/standalone/.next/static", {
    recursive: true,
    force: true,
  }),
]);
console.log("Copied public and static assets into the standalone deployment.");
