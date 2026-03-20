import type { Route } from "../core/routes/route.js";
import type { AppleHealthImporter } from "./apple-health-importer-factory.js";

type Options = { appleHealthImporter: AppleHealthImporter };

export const appleHealthRoutesFactory = ({ appleHealthImporter }: Options): Route => ({
  path: "/apple-health",
  async apply(fastify) {
    fastify.post("/import", async (request, reply) => {
      const data = await request.file();
      if (!data) return reply.status(400).send({ error: "No file uploaded" });
      await appleHealthImporter.import(data.file);
      return reply.status(204).send();
    });
  },
});
