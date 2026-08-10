/**
 * Compile every folder under packs/_source/<name> into a Foundry LevelDB pack at
 * packs/<name>. Run with: npm run build:packs  (Foundry must be closed first, or
 * the pack's LevelDB lock will block the build).
 */
import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "packs", "_source");

const dirs = readdirSync(sourceRoot).filter(name =>
  statSync(path.join(sourceRoot, name)).isDirectory()
);

if (!dirs.length) {
  console.log("No pack sources found under packs/_source.");
  process.exit(0);
}

for (const name of dirs) {
  const src = path.join(sourceRoot, name);
  const dest = path.join(root, "packs", name);
  console.log(`Compiling ${name} -> packs/${name}`);
  await compilePack(src, dest, { log: true });
}

console.log("Done.");
