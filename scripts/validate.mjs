import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const modulePath = path.join(root, "module.json");
const packagePath = path.join(root, "package.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if ([".git", ".release-temp"].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

const moduleJson = readJson(modulePath);
const packageJson = readJson(packagePath);

assert(moduleJson.version === packageJson.version, "module.json and package.json versions must match.");
assert(moduleJson.protected === false, "module.json must use protected: false.");
assert(moduleJson.compatibility?.minimum === 13, "Minimum compatibility must be 13.");
assert(moduleJson.compatibility?.verified === 14, "Verified compatibility must be 14.");
assert(
  /\/releases\/latest\/download\/module\.json$/.test(moduleJson.manifest),
  "module.json manifest must use /releases/latest/download/module.json"
);
assert(
  /\/releases\/latest\/download\/module\.zip$/.test(moduleJson.download),
  "module.json download must use /releases/latest/download/module.zip"
);

const requiredFiles = [
  "module.json",
  "package.json",
  "README.md",
  "LICENSE",
  path.join("scripts", "module.js"),
  path.join("scripts", "validate.mjs"),
  path.join("scripts", "build-release.mjs"),
  path.join("templates", "settings.html"),
  path.join("styles", "module.css"),
  path.join("styles", "config.css"),
  path.join("lang", "en.json")
];

for (const relPath of requiredFiles) {
  assert(fs.existsSync(path.join(root, relPath)), `Missing required file: ${relPath}`);
}

const trackedExtensions = new Set([".js", ".css", ".html", ".json", ".md"]);
const repoFiles = walk(root).filter((filePath) => trackedExtensions.has(path.extname(filePath).toLowerCase()));

for (const filePath of repoFiles) {
  const text = fs.readFileSync(filePath, "utf8");
  assert(!text.includes("<<<<<<<") && !text.includes(">>>>>>>") && !text.includes("======="), `Merge marker found in ${path.relative(root, filePath)}`);
  const lines = text.split(/\r?\n/).length;
  if ([".js", ".css"].includes(path.extname(filePath).toLowerCase())) {
    assert(lines <= 500, `${path.relative(root, filePath)} exceeds 500 lines (${lines}).`);
  }
}

console.log("Validation passed.");
