import { createProviders } from "../common/inject/container.ts";
import { registerRoutes } from "../core/routes/register-routes.ts";
import { medplumFactory } from "../core/medplumFactory.js";
import { appleHealthImporterFactory } from "./apple-health-importer-factory.js";
import { appleHealthRoutesFactory } from "./apple-health-routes-factory.js";

export const appleHealthProviders = createProviders({
  medplum: medplumFactory,
  appleHealthImporter: appleHealthImporterFactory,
  ...registerRoutes(appleHealthRoutesFactory),
});
