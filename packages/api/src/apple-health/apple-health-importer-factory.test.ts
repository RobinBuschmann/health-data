import { createReadStream } from "fs";
import { join } from "path";
import { describe, it, expect, beforeEach } from "vitest";
import { MedplumClient } from "@medplum/core";
import {
  AppleHealthImporter,
  appleHealthImporterFactory,
} from "./apple-health-importer-factory.js";
import { createMock } from "../common/testing/create-mock.js";
import { appleHealthMapperFactory } from "./apple-health-mapper-factory.js";

const fixture = (name: string) => createReadStream(join(import.meta.dirname, "__fixtures__", name));

const medplum = createMock<MedplumClient>();

let appleHealthImporter: AppleHealthImporter;

beforeEach(() => {
  medplum.mockClear();
  medplum.createResource.mockResolvedValue({
    id: "patient-123",
    resourceType: "Patient",
  });
  medplum.executeBatch.mockResolvedValue({
    resourceType: "Bundle",
    type: "batch-response",
    entry: [],
  });

  appleHealthImporter = appleHealthImporterFactory({
    medplum,
    appleHealthMapper: appleHealthMapperFactory(),
  });
});

describe("given a Me tag", () => {
  beforeEach(async () => {
    await appleHealthImporter.import(fixture("valid-export.zip"));
  });

  it("should create a patient with the correct birth date and gender", () => {
    expect(medplum.createResource).toHaveBeenCalledWith({
      resourceType: "Patient",
      birthDate: "1990-01-15",
      gender: "male",
    });
  });
});

describe("given supported Record tags", () => {
  beforeEach(async () => {
    await appleHealthImporter.import(fixture("valid-export.zip"));
  });

  it("should write observations to Medplum via executeBatch", () => {
    expect(medplum.executeBatch).toHaveBeenCalledOnce();
  });

  it("should reference the created patient in each observation", () => {
    const bundle = medplum.executeBatch.mock.calls[0][0];
    expect(
      bundle.entry?.every(
        (entry) =>
          entry.resource &&
          "subject" in entry.resource &&
          typeof entry.resource.subject === "object" &&
          "reference" in entry.resource.subject &&
          entry.resource.subject.reference === "Patient/patient-123",
      ),
    ).toBe(true);
  });
});

describe("given unsupported Record tags", () => {
  beforeEach(async () => {
    await appleHealthImporter.import(fixture("valid-export.zip"));
  });

  it("should not include them in the batch", () => {
    const bundle = medplum.executeBatch.mock.calls[0][0];
    expect(bundle.entry).toHaveLength(5);
  });
});

describe("given a Record tag before a Me tag", () => {
  let promise: Promise<void>;

  beforeEach(() => {
    promise = appleHealthImporter.import(fixture("record-before-me.zip"));
  });

  it("should throw that a Record appeared before the Me tag", async () => {
    await expect(promise).rejects.toThrow("Record tag appeared before Me tag");
  });
});

describe("given more than 100 records", () => {
  beforeEach(async () => {
    await appleHealthImporter.import(fixture("large-export.zip"));
  });

  it("should call executeBatch multiple times", () => {
    expect(medplum.executeBatch).toHaveBeenCalledTimes(2);
  });
});
