import "./env.ts";
import { createApp } from "./app.ts";

const app = await createApp();

try {
  await app.listen({ port: Number(process.env.API_PORT) || 3000, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
