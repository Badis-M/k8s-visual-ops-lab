import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ESLint } from "eslint";

const root = process.cwd();
const digest = (value) => createHash("sha256").update(value).digest("hex");
const baseline = JSON.parse(await readFile("scripts/lint-baseline.json", "utf8"));
const configHash = digest(await readFile("eslint.config.js"));
if (configHash !== baseline.configHash) {
  throw new Error("ESLint configuration changed: review the inherited baseline explicitly.");
}
const eslint = new ESLint();
const results = await eslint.lintFiles(".");
const failures = [];
let inherited = 0;
for (const result of results) {
  if (result.messages.length === 0) continue;
  const file = path.relative(root, result.filePath).split(path.sep).join("/");
  const fingerprint = digest(JSON.stringify(result.messages));
  const sourceHash = digest(await readFile(result.filePath));
  const entry = baseline.files[file];
  if (entry?.sourceHash === sourceHash && entry?.fingerprint === fingerprint) {
    inherited += result.messages.length;
  } else failures.push(result);
}
if (failures.length) {
  const formatter = await eslint.loadFormatter("stylish");
  console.error(formatter.format(failures));
  process.exitCode = 1;
}
console.log(
  `ESLint: ${inherited} frozen inherited diagnostics; ${failures.length} files need correction.`,
);
