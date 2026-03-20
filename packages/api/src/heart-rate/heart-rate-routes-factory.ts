import { z } from "zod";
import type { Route } from "../core/routes/route.js";
import type { HeartRateService } from "./heart-rate-service-factory.js";
import { heartRateSchema } from "./heart-rate-dtos.js";

type HeartRateRoutesOptions = {
  heartRateService: HeartRateService;
};

export const heartRateRoutesFactory = ({ heartRateService }: HeartRateRoutesOptions): Route => ({
  path: "/heart-rates",
  async apply(fastify) {
    fastify.get(
      "/",
      {
        schema: {
          querystring: z.object({
            patientId: z.string().optional(),
            from: z.iso.date().optional(),
            to: z.iso.date().optional(),
            sort: z.enum(["asc", "desc"]).default("asc"),
            limit: z.coerce.number().int().min(1).max(1000).default(100),
          }),
          response: {
            200: z.array(heartRateSchema),
          },
        },
      },
      (request) =>
        heartRateService.getAll(
          request.query.patientId,
          request.query.from,
          request.query.to,
          request.query.sort,
          request.query.limit,
        ),
    );
  },
});
