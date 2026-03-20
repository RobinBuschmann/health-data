import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import type { Route } from "./core/routes/route.ts";
import { Medplum } from "./core/medplumFactory.js";

type FastifyOptions = {
  logger?: boolean;
  routes: Route[];
  medplum: Medplum;
};
export const fastifyFactory = ({ routes, logger, medplum }: FastifyOptions) => ({
  async create() {
    const app = Fastify({ logger: logger ?? true });

    app.setSerializerCompiler(serializerCompiler);
    app.setValidatorCompiler(validatorCompiler);

    await app.register(multipart);
    await app.register(cors, {
      origin: process.env.CORS_ORIGIN ?? "http://localhost:3001",
    });

    await medplum.startClientLogin();

    routes.forEach((route) => app.register(route.apply.bind(route), { prefix: route.path }));

    return app;
  },
});
