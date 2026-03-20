import { createProviders } from "../common/inject/container.ts";
import { registerRoutes } from "../core/routes/register-routes.ts";
import { medplumFactory } from "../core/medplumFactory.js";
import { patientServiceFactory } from "./patient-service-factory.js";
import { patientRoutesFactory } from "./patient-routes-factory.js";

export const patientProviders = createProviders({
  medplum: medplumFactory,
  patientService: patientServiceFactory,
  ...registerRoutes(patientRoutesFactory),
});
