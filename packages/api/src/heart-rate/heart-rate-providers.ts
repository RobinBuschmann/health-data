import { createProviders } from "../common/inject/container.ts";
import { registerRoutes } from "../core/routes/register-routes.ts";
import { heartRateRoutesFactory } from "./heart-rate-routes-factory.js";
import { heartRateServiceFactory } from "./heart-rate-service-factory.js";
import { medplumFactory } from "../core/medplumFactory.js";

export const heartRateProviders = createProviders({
  medplum: medplumFactory,
  heartRateService: heartRateServiceFactory,
  ...registerRoutes(heartRateRoutesFactory),
});
