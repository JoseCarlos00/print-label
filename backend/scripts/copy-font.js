import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.resolve(
  __dirname,
  "../../shared/zpl/fonts/tt0003m_.ttf"
);

const destinationDir = path.resolve(
  __dirname,
  "../dist"
);

const destination = path.join(
  destinationDir,
  "tt0003m_.ttf"
);

await mkdir(destinationDir, { recursive: true });
await copyFile(source, destination);

console.log("Font copied successfully.");
