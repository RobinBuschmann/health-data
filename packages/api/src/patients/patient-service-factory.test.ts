import { beforeEach, describe, expect, it } from "vitest";
import { ResourceArray } from "@medplum/core";
import { PatientService, patientServiceFactory } from "./patient-service-factory.js";
import { createMock } from "../common/testing/create-mock.js";
import type { Patient } from "./patient-dtos.js";
import { Medplum } from "../core/medplumFactory.js";
import { fromPartial } from "../common/testing/from-partial.js";
import { Patient as FhirPatient } from "@medplum/fhirtypes";

const medplum = createMock<Medplum>();

let patientService: PatientService;

beforeEach(() => {
  medplum.mockClear();
  patientService = patientServiceFactory({ medplum });
});

describe("given patients exist", () => {
  let result: Patient[];

  beforeEach(async () => {
    medplum.searchResources.mockResolvedValue(
      fromPartial<ResourceArray<FhirPatient>>([
        {
          id: "patient-1",
          resourceType: "Patient",
          birthDate: "1990-01-15",
          gender: "male",
        },
      ]),
    );
    result = await patientService.getAll();
  });

  it("should search for Patient resources", () => {
    expect(medplum.searchResources).toHaveBeenCalledWith("Patient", {});
  });

  it("should return mapped patients", () => {
    expect(result).toEqual([{ id: "patient-1", birthDate: "1990-01-15", gender: "male" }]);
  });
});

describe("given no patients", () => {
  let result: Patient[];

  beforeEach(async () => {
    medplum.searchResources.mockResolvedValue(fromPartial<ResourceArray<FhirPatient>>([]));
    result = await patientService.getAll();
  });

  it("should return an empty array", () => {
    expect(result).toEqual([]);
  });
});

describe("given a patient without optional fields", () => {
  let result: Patient[];

  beforeEach(async () => {
    medplum.searchResources.mockResolvedValue(
      fromPartial<ResourceArray<FhirPatient>>([{ id: "patient-2", resourceType: "Patient" }]),
    );
    result = await patientService.getAll();
  });

  it("should return the patient with only its id", () => {
    expect(result).toEqual([{ id: "patient-2" }]);
  });
});

describe("given a patient without an id", () => {
  let promise: Promise<Patient[]>;

  beforeEach(() => {
    medplum.searchResources.mockResolvedValue(
      fromPartial<ResourceArray<FhirPatient>>([
        { resourceType: "Patient", birthDate: "1990-01-15" },
      ]),
    );
    promise = patientService.getAll();
  });

  it("should throw Patient id is missing", async () => {
    await expect(promise).rejects.toThrow("Patient id is missing");
  });
});

describe("given multiple patients", () => {
  let result: Patient[];

  beforeEach(async () => {
    medplum.searchResources.mockResolvedValue(
      fromPartial<ResourceArray<FhirPatient>>([
        { id: "p1", resourceType: "Patient", gender: "male" },
        { id: "p2", resourceType: "Patient", gender: "female" },
      ]),
    );
    result = await patientService.getAll();
  });

  it("should return all patients", () => {
    expect(result).toHaveLength(2);
  });

  it("should map each patient correctly", () => {
    expect(result[1]).toEqual({ id: "p2", gender: "female" });
  });
});
