import Fastify, { FastifyInstance, LightMyRequestResponse } from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { describe, it, expect, beforeEach } from "vitest";
import { heartRateRoutesFactory } from "./heart-rate-routes-factory.js";
import type { HeartRateService } from "./heart-rate-service-factory.js";
import { createMock } from "../common/testing/create-mock.js";

const heartRateService = createMock<HeartRateService>();

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  app.setSerializerCompiler(serializerCompiler);
  app.setValidatorCompiler(validatorCompiler);
  const route = heartRateRoutesFactory({ heartRateService });
  await app.register(route.apply.bind(route), { prefix: route.path });
  return app;
}

let app: FastifyInstance;

beforeEach(async () => {
  heartRateService.mockClear();
  app = await buildApp();
});

describe("GET /heart-rates", () => {
  describe("given the service returns heart rates", () => {
    let response: LightMyRequestResponse;

    beforeEach(async () => {
      heartRateService.getAll.mockResolvedValue([
        { timestamp: "2024-01-01T00:00:00.000Z", bpm: 72 },
      ]);
      response = await app.inject({ method: "GET", url: "/heart-rates" });
    });

    it("should respond with 200", () => {
      expect(response.statusCode).toBe(200);
    });

    it("should return the heart rates as JSON", () => {
      expect(response.json()).toEqual([{ timestamp: "2024-01-01T00:00:00.000Z", bpm: 72 }]);
    });
  });

  describe("given no query params", () => {
    beforeEach(async () => {
      heartRateService.getAll.mockResolvedValue([]);
      await app.inject({ method: "GET", url: "/heart-rates" });
    });

    it("should call the service with default values", () => {
      expect(heartRateService.getAll).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        "asc",
        100,
      );
    });
  });

  describe("given all query params", () => {
    beforeEach(async () => {
      heartRateService.getAll.mockResolvedValue([]);
      await app.inject({
        method: "GET",
        url: "/heart-rates?patientId=p1&from=2024-01-01&to=2024-12-31&sort=desc&limit=10",
      });
    });

    it("should pass all params to the service", () => {
      expect(heartRateService.getAll).toHaveBeenCalledWith(
        "p1",
        "2024-01-01",
        "2024-12-31",
        "desc",
        10,
      );
    });
  });

  describe("given an invalid sort value", () => {
    let response: LightMyRequestResponse;

    beforeEach(async () => {
      response = await app.inject({
        method: "GET",
        url: "/heart-rates?sort=invalid",
      });
    });

    it("should respond with 400", () => {
      expect(response.statusCode).toBe(400);
    });
  });

  describe("given a limit above the maximum", () => {
    let response: LightMyRequestResponse;

    beforeEach(async () => {
      response = await app.inject({
        method: "GET",
        url: "/heart-rates?limit=9999",
      });
    });

    it("should respond with 400", () => {
      expect(response.statusCode).toBe(400);
    });
  });

  describe("given an invalid from date", () => {
    let response: LightMyRequestResponse;

    beforeEach(async () => {
      response = await app.inject({
        method: "GET",
        url: "/heart-rates?from=not-a-date",
      });
    });

    it("should respond with 400", () => {
      expect(response.statusCode).toBe(400);
    });
  });
});
