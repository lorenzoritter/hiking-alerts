import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workerRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedRoot = path.join(workerRoot, "dist", "src", "generated");

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(entryPath);
      continue;
    }
    if (!entry.name.endsWith(".js")) continue;

    const source = await readFile(entryPath, "utf8");
    const fixed = source.replace(/(\bfrom\s+|\bimport\s*\()(\s*)(['"])(\.{1,2}\/[^'"\n]+?)\3/g, (match, prefix, spacing, quote, specifier) => {
      if (path.extname(specifier) || specifier.endsWith("/")) return match;
      return `${prefix}${spacing}${quote}${specifier}.js${quote}`;
    });
    if (fixed !== source) await writeFile(entryPath, fixed);
  }
}

await visit(generatedRoot);
