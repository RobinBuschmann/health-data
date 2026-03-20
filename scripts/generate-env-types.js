import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const envExample = readFileSync(join(rootDir, ".env.example"), "utf-8");

const vars = envExample
  .split("\n")
  .filter((line) => line.trim() && !line.startsWith("#"))
  .map((line) => line.split("=")[0].trim())
  .filter(Boolean);

const nodeVars = vars.filter((v) => !v.startsWith("VITE_"));
const viteVars = vars.filter((v) => v.startsWith("VITE_"));

const types = `\
// Auto-generated from .env.example — do not edit manually

declare namespace NodeJS {
  interface ProcessEnv {
${nodeVars.map((v) => `    ${v}?: string;`).join("\n")}
  }
}

interface ImportMetaEnv {
${viteVars.map((v) => `  readonly ${v}?: string;`).join("\n")}
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
`;

writeFileSync(join(rootDir, "env.d.ts"), types);

console.log(`Generated env.d.ts`);
console.log(`  Node vars (${nodeVars.length}): ${nodeVars.join(", ")}`);
console.log(`  Vite vars (${viteVars.length}): ${viteVars.join(", ")}`);
