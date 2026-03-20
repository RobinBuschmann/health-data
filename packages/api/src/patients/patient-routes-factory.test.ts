import Fastify, { FastifyInstance, LightMyRequestResponse } from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { describe, it, expect, beforeEach } from "vitest";
import { patientRoutesFactory } from "./patient-routes-factory.js";
import type { PatientService } from "./patient-service-factory.js";
import { createMock } from "../common/testing/create-mock.js";
import type { Patient } from "./patient-dtos.js";

const patientService = createMock<PatientService>();

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  app.setSerializerCompiler(serializerCompiler);
  app.setValidatorCompiler(validatorCompiler);
  const route = patientRoutesFactory({ patientService });
  await app.register(route.apply.bind(route), { prefix: route.path });
  return app;
}

let app: FastifyInstance;

beforeEach(async () => {
  patientService.mockClear();
  app = await buildApp();
});

describe("GET /patients", () => {
  describe("given patients exist", () => {
    const patients: Patient[] = [{ id: "p1", birthDate: "1990-01-15", gender: "male" }];
    let response: LightMyRequestResponse;

    beforeEach(async () => {
      patientService.getAll.mockResolvedValue(patients);
      response = await app.inject({ method: "GET", url: "/patients" });
    });

    it("should respond with 200", () => {
      expect(response.statusCode).toBe(200);
    });

    it("should return the patients as JSON", () => {
      expect(response.json()).toEqual(patients);
    });
  });

  describe("given no patients", () => {
    let response: LightMyRequestResponse;

    beforeEach(async () => {
      patientService.getAll.mockResolvedValue([]);
      response = await app.inject({ method: "GET", url: "/patients" });
    });

    it("should respond with 200", () => {
      expect(response.statusCode).toBe(200);
    });

    it("should return an empty array", () => {
      expect(response.json()).toEqual([]);
    });
  });

  describe("given patients with optional fields omitted", () => {
    let response: LightMyRequestResponse;

    beforeEach(async () => {
      patientService.getAll.mockResolvedValue([{ id: "p2" }]);
      response = await app.inject({ method: "GET", url: "/patients" });
    });

    it("should respond with 200", () => {
      expect(response.statusCode).toBe(200);
    });

    it("should return patients with only their id", () => {
      expect(response.json()).toEqual([{ id: "p2" }]);
    });
  });
});
