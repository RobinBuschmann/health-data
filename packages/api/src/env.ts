import { config } from "dotenv";
import { expand } from "dotenv-expand";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../../.env");
if (!fs.existsSync(envPath)) {
  throw new Error("Missing .env file: Copy .env.example to .env and fill in your credentials.");
}
expand(config({ path: envPath }));
