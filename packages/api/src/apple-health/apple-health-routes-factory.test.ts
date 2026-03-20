import Fastify, { FastifyInstance, LightMyRequestResponse } from "fastify";
import multipart from "@fastify/multipart";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { describe, it, expect, beforeEach } from "vitest";
import { appleHealthRoutesFactory } from "./apple-health-routes-factory.js";
import type { AppleHealthImporter } from "./apple-health-importer-factory.js";
import { createMock } from "../common/testing/create-mock.js";

const appleHealthImporter = createMock<AppleHealthImporter>();

const BOUNDARY = "testboundary";
const CONTENT_TYPE = `multipart/form-data; boundary=${BOUNDARY}`;

function buildMultipartBody(filename: string, content: Buffer): Buffer {
  return Buffer.concat([
    Buffer.from(`--${BOUNDARY}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`),
    Buffer.from("Content-Type: application/octet-stream\r\n"),
    Buffer.from("\r\n"),
    content,
    Buffer.from(`\r\n--${BOUNDARY}--\r\n`),
  ]);
}

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  app.setSerializerCompiler(serializerCompiler);
  app.setValidatorCompiler(validatorCompiler);
  await app.register(multipart);
  const route = appleHealthRoutesFactory({ appleHealthImporter });
  await app.register(route.apply.bind(route), { prefix: route.path });
  return app;
}

let app: FastifyInstance;

beforeEach(async () => {
  appleHealthImporter.mockClear();
  app = await buildApp();
});

describe("POST /apple-health/import", () => {
  describe("given a file is uploaded", () => {
    let response: LightMyRequestResponse;

    beforeEach(async () => {
      appleHealthImporter.import.mockResolvedValue(undefined);
      response = await app.inject({
        method: "POST",
        url: "/apple-health/import",
        payload: buildMultipartBody("export.zip", Buffer.from("zip-content")),
        headers: { "content-type": CONTENT_TYPE },
      });
    });

    it("should respond with 204", () => {
      expect(response.statusCode).toBe(204);
    });

    it("should call the importer with the file stream", () => {
      expect(appleHealthImporter.import).toHaveBeenCalledOnce();
    });
  });

  describe("given no file part in the request", () => {
    let response: LightMyRequestResponse;

    beforeEach(async () => {
      response = await app.inject({
        method: "POST",
        url: "/apple-health/import",
        payload: Buffer.from(`--${BOUNDARY}--\r\n`),
        headers: { "content-type": CONTENT_TYPE },
      });
    });

    it("should respond with 400", () => {
      expect(response.statusCode).toBe(400);
    });
  });
});
