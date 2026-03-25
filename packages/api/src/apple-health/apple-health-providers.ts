import { createProviders } from "../common/inject/container.ts";
import { registerRoutes } from "../core/routes/register-routes.ts";
import { medplumFactory } from "../core/medplumFactory.js";
import { appleHealthImporterFactory } from "./apple-health-importer-factory.js";
import { appleHealthRoutesFactory } from "./apple-health-routes-factory.js";
import { appleHealthMapperFactory } from "./apple-health-mapper-factory.js";

export const appleHealthProviders = createProviders({
  medplum: medplumFactory,
  appleHealthImporter: appleHealthImporterFactory,
  appleHealthMapper: appleHealthMapperFactory,
  ...registerRoutes(appleHealthRoutesFactory),
});
