import { beforeEach, describe, expect, it } from "vitest";
import type { Observation, Patient } from "@medplum/fhirtypes";
import { isSupportedRecord, mapPatient, mapRecord } from "./apple-health-mapper.js";

describe("isSupportedRecord", () => {
  describe("given an object with a known HK type", () => {
    let result: boolean;

    beforeEach(() => {
      result = isSupportedRecord({ type: "HKQuantityTypeIdentifierHeartRate" });
    });

    it("should return true", () => {
      expect(result).toBe(true);
    });
  });

  describe("given an object with an unknown type", () => {
    let result: boolean;

    beforeEach(() => {
      result = isSupportedRecord({ type: "HKQuantityTypeIdentifierUnknown" });
    });

    it("should return false", () => {
      expect(result).toBe(false);
    });
  });

  describe("given an object without a type field", () => {
    let result: boolean;

    beforeEach(() => {
      result = isSupportedRecord({ sourceName: "iPhone" });
    });

    it("should return false", () => {
      expect(result).toBe(false);
    });
  });
});

describe("mapRecord", () => {
  describe("given a heart rate record", () => {
    let result: Observation;

    beforeEach(() => {
      result = mapRecord(
        {
          type: "HKQuantityTypeIdentifierHeartRate",
          sourceName: "Apple Watch",
          unit: "count/min",
          startDate: "2024-01-15T10:30:00+01:00",
          value: "72",
        },
        "Patient/patient-1",
      );
    });

    it("should set resourceType to Observation", () => {
      expect(result.resourceType).toBe("Observation");
    });

    it("should set status to final", () => {
      expect(result.status).toBe("final");
    });

    it("should set the LOINC coding system", () => {
      expect(result.code.coding?.[0].system).toBe("http://loinc.org");
    });

    it("should set the LOINC code", () => {
      expect(result.code.coding?.[0].code).toBe("8867-4");
    });

    it("should set the LOINC display", () => {
      expect(result.code.coding?.[0].display).toBe("Heart rate");
    });

    it("should set the subject reference", () => {
      expect(result.subject).toEqual({ reference: "Patient/patient-1" });
    });

    it("should convert startDate to an ISO datetime", () => {
      expect(result.effectiveDateTime).toBe("2024-01-15T09:30:00.000Z");
    });

    it("should set the numeric value", () => {
      expect(result.valueQuantity?.value).toBe(72);
    });

    it("should set the source unit", () => {
      expect(result.valueQuantity?.unit).toBe("count/min");
    });

    it("should set the UCUM system", () => {
      expect(result.valueQuantity?.system).toBe("http://unitsofmeasure.org");
    });

    it("should set the UCUM unit code", () => {
      expect(result.valueQuantity?.code).toBe("/min");
    });
  });

  describe("given a step count record", () => {
    let result: Observation;

    beforeEach(() => {
      result = mapRecord(
        {
          type: "HKQuantityTypeIdentifierStepCount",
          sourceName: "iPhone",
          unit: "count",
          startDate: "2024-01-15T00:00:00Z",
          value: "4231",
        },
        "Patient/patient-1",
      );
    });

    it("should set the LOINC code for step count", () => {
      expect(result.code.coding?.[0].code).toBe("55423-8");
    });

    it("should parse the value as a float", () => {
      expect(result.valueQuantity?.value).toBe(4231);
    });

    it("should set the UCUM unit code for steps", () => {
      expect(result.valueQuantity?.code).toBe("steps");
    });
  });

  describe("given a decimal value", () => {
    let result: Observation;

    beforeEach(() => {
      result = mapRecord(
        {
          type: "HKQuantityTypeIdentifierBodyMass",
          sourceName: "iPhone",
          unit: "kg",
          startDate: "2024-01-15T00:00:00Z",
          value: "72.5",
        },
        "Patient/patient-1",
      );
    });

    it("should parse the value as a float", () => {
      expect(result.valueQuantity?.value).toBe(72.5);
    });
  });
});

describe("mapPatient", () => {
  describe("given a date of birth and male biological sex", () => {
    let result: Patient;

    beforeEach(() => {
      result = mapPatient({
        dateOfBirth: "1990-01-15",
        biologicalSex: "HKBiologicalSexMale",
      });
    });

    it("should set resourceType to Patient", () => {
      expect(result.resourceType).toBe("Patient");
    });

    it("should set birthDate", () => {
      expect(result.birthDate).toBe("1990-01-15");
    });

    it("should set gender to male", () => {
      expect(result.gender).toBe("male");
    });
  });

  describe("given female biological sex", () => {
    let result: Patient;

    beforeEach(() => {
      result = mapPatient({ biologicalSex: "HKBiologicalSexFemale" });
    });

    it("should set gender to female", () => {
      expect(result.gender).toBe("female");
    });
  });

  describe("given an unrecognised biological sex", () => {
    let result: Patient;

    beforeEach(() => {
      result = mapPatient({ biologicalSex: "HKBiologicalSexNotSet" });
    });

    it("should set gender to unknown", () => {
      expect(result.gender).toBe("unknown");
    });
  });

  describe("given no fields", () => {
    let result: Patient;

    beforeEach(() => {
      result = mapPatient({});
    });

    it("should omit birthDate", () => {
      expect(result.birthDate).toBeUndefined();
    });

    it("should omit gender", () => {
      expect(result.gender).toBeUndefined();
    });
  });
});
