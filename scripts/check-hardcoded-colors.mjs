import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const roots = [path.join(process.cwd(), "src", "app"), path.join(process.cwd(), "src", "components")];
const exceptions = [
  `${path.sep}src${path.sep}app${path.sep}admin${path.sep}`,
  `${path.sep}src${path.sep}components${path.sep}admin${path.sep}`,
  `${path.sep}src${path.sep}components${path.sep}layout${path.sep}SiteHeader.tsx`,
  `${path.sep}src${path.sep}components${path.sep}layout${path.sep}SiteFooter.tsx`,
  `${path.sep}src${path.sep}components${path.sep}ui${path.sep}CardBrandBadge.tsx`,
];
const pattern = /(?:bg|text|border|from)-\[#[0-9a-f]{3,8}\]|style=\{\{\s*backgroundColor/gim;
const failures = [];
async function walk(directory) { for (const entry of await readdir(directory, { withFileTypes: true })) { const target = path.join(directory, entry.name); if (entry.isDirectory()) await walk(target); else if (/\.[jt]sx?$/.test(entry.name) && !exceptions.some((value) => target.includes(value))) { const source = await readFile(target, "utf8"); source.split(/\r?\n/).forEach((line, index) => { if (pattern.test(line)) failures.push(`${path.relative(process.cwd(), target)}:${index + 1}: ${line.trim()}`); pattern.lastIndex = 0; }); } } }
for (const root of roots) await walk(root);
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log("Nenhuma cor estrutural fixa encontrada fora das exceções.");
