import { createContainer } from "./common/inject/container.ts";
import { fastifyFactory } from "./fastify-factory.ts";
import { heartRateProviders } from "./heart-rate/heart-rate-providers.js";
import { patientProviders } from "./patients/patient-providers.js";
import { appleHealthProviders } from "./apple-health/apple-health-providers.js";

export const createApp = () => {
  const { fastify } = createContainer({
    fastify: fastifyFactory,
    ...heartRateProviders,
    ...patientProviders,
    ...appleHealthProviders,
  });
  return fastify.create();
};
