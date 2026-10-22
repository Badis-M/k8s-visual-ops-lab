/* global Bun */
import { spawnSync } from "node:child_process";

// Parse authored fixtures without loading application code or contacting a cluster.
const counts = { yamlFiles: 0, yamlDocuments: 0, jsonFiles: 0, shellFiles: 0, pythonFiles: 0 };
const checkedFiles = [];
const failures = [];

function syntax(command, args, source) {
  const result = spawnSync(command, args, { input: source, encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || `${command} exited ${result.status}`);
}

for (const path of new Bun.Glob("lab/**/*").scanSync({ cwd: ".", onlyFiles: true })) {
  // Helm templates are not YAML until rendered; their lint/render checks are separate.
  if (path.includes("/templates/") || path.includes("/__pycache__/")) continue;
  try {
    if (/\.ya?ml$/.test(path)) {
      const result = Bun.YAML.parse(await Bun.file(path).text());
      if (result === null || result === undefined) throw new Error("Empty YAML fixture");
      counts.yamlFiles++;
      counts.yamlDocuments += Array.isArray(result) ? result.length : 1;
    } else if (path.endsWith(".json")) {
      JSON.parse(await Bun.file(path).text());
      counts.jsonFiles++;
    } else if (path.endsWith(".sh")) {
      syntax("bash", ["-n"], await Bun.file(path).text());
      counts.shellFiles++;
    } else if (path.endsWith(".py")) {
      syntax(
        "python3",
        ["-c", "import ast,sys; ast.parse(sys.stdin.read(), feature_version=(3, 12))"],
        await Bun.file(path).text(),
      );
      counts.pythonFiles++;
    } else {
      continue;
    }
    checkedFiles.push(path);
  } catch (error) {
    failures.push(`${path}: ${error.message}`);
  }
}

if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(counts, null, 2));
  console.log(
    `${checkedFiles.length} fixture files checked offline. Helm rendering, Go compilation, admission, runtime behavior and real cluster labs require separate checks.`,
  );
}
