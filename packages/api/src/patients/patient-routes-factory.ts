import { z } from "zod";
import type { Route } from "../core/routes/route.js";
import type { PatientService } from "./patient-service-factory.js";
import { patientSchema } from "./patient-dtos.js";

type PatientRoutesOptions = {
  patientService: PatientService;
};

export const patientRoutesFactory = ({ patientService }: PatientRoutesOptions): Route => ({
  path: "/patients",
  async apply(fastify) {
    fastify.get(
      "/",
      {
        schema: {
          response: {
            200: z.array(patientSchema),
          },
        },
      },
      () => patientService.getAll(),
    );
  },
});
