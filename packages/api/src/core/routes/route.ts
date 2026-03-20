import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

export type Route = {
  path: string;
  apply: FastifyPluginAsyncZod;
};
