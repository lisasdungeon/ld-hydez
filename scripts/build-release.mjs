import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");
const tempDir = path.join(root, ".release-temp");
const zipPath = path.join(root, "module.zip");
const includeTopLevel = ["assets", "lang", "module.json", "LICENSE", "README.md", "CHANGELOG.md", "scripts", "styles", "templates"];

fs.rmSync(tempDir, { recursive: true, force: true });
fs.rmSync(zipPath, { force: true });
fs.mkdirSync(tempDir, { recursive: true });

for (const entry of includeTopLevel) {
  const source = path.join(root, entry);
  if (!fs.existsSync(source)) continue;
  const target = path.join(tempDir, entry);
  fs.cpSync(source, target, { recursive: true });
}

if (process.platform === 'win32') {
  const archiveSource = path.join(tempDir, "*");
  const command = `Compress-Archive -Path '${archiveSource}' -DestinationPath '${zipPath}' -Force`;
  execFileSync("powershell", ["-NoProfile", "-Command", command], { stdio: "inherit" });
} else {
  execFileSync("zip", ["-r", zipPath, "."], { cwd: tempDir, stdio: "inherit" });
}

fs.rmSync(tempDir, { recursive: true, force: true });
console.log(`Built ${path.basename(zipPath)}`);
