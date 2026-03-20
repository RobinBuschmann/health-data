import { beforeEach, describe, expect, it } from "vitest";
import { HeartRateService, heartRateServiceFactory } from "./heart-rate-service-factory.js";
import { createMock } from "../common/testing/create-mock.js";
import type { HeartRate } from "./heart-rate-dtos.js";
import { fromPartial } from "../common/testing/from-partial.js";
import { Observation } from "@medplum/fhirtypes";
import { Medplum } from "../core/medplumFactory.js";
import { ResourceArray } from "@medplum/core";

const medplum = createMock<Medplum>();

let heartRateService: HeartRateService;

beforeEach(() => {
  medplum.mockClear();
  heartRateService = heartRateServiceFactory({ medplum });
});

describe("given no filters", () => {
  let result: HeartRate[];

  beforeEach(async () => {
    medplum.searchResources.mockResolvedValue(
      fromPartial<ResourceArray<Observation>>([
        {
          resourceType: "Observation",
          effectiveDateTime: "2024-01-01T00:00:00.000Z",
          valueQuantity: { value: 72 },
        },
      ]),
    );
    result = await heartRateService.getAll();
  });

  it("should search for heart rate observations by LOINC code", () => {
    expect(medplum.searchResources).toHaveBeenCalledWith(
      "Observation",
      expect.stringContaining("code="),
    );
  });

  it("should use ascending sort by default", () => {
    expect(medplum.searchResources).toHaveBeenCalledWith(
      "Observation",
      expect.stringContaining("_sort=date"),
    );
  });

  it("should return mapped heart rates", () => {
    expect(result).toEqual([{ timestamp: "2024-01-01T00:00:00.000Z", bpm: 72 }]);
  });
});

describe("given a patientId filter", () => {
  beforeEach(async () => {
    medplum.searchResources.mockResolvedValue(fromPartial<ResourceArray<Observation>>([]));
    await heartRateService.getAll("patient-123");
  });

  it("should include the patient in the query", () => {
    expect(medplum.searchResources).toHaveBeenCalledWith(
      "Observation",
      expect.stringContaining("patient=patient-123"),
    );
  });
});

describe("given from and to date filters", () => {
  let params: string;

  beforeEach(async () => {
    medplum.searchResources.mockResolvedValue(fromPartial<ResourceArray<Observation>>([]));
    await heartRateService.getAll(undefined, "2024-01-01", "2024-12-31");
    params = medplum.searchResources.mock.calls[0][1] as string;
  });

  it("should include the from date bound in the query", () => {
    expect(params).toContain("ge2024-01-01");
  });

  it("should include the to date bound in the query", () => {
    expect(params).toContain("le2024-12-31");
  });
});

describe("given sort desc", () => {
  beforeEach(async () => {
    medplum.searchResources.mockResolvedValue(fromPartial<ResourceArray<Observation>>([]));
    await heartRateService.getAll(undefined, undefined, undefined, "desc");
  });

  it("should use -date sort parameter", () => {
    expect(medplum.searchResources).toHaveBeenCalledWith(
      "Observation",
      expect.stringContaining("_sort=-date"),
    );
  });
});

describe("given a custom limit", () => {
  beforeEach(async () => {
    medplum.searchResources.mockResolvedValue(fromPartial<ResourceArray<Observation>>([]));
    await heartRateService.getAll(undefined, undefined, undefined, "asc", 50);
  });

  it("should include the limit in the query", () => {
    expect(medplum.searchResources).toHaveBeenCalledWith(
      "Observation",
      expect.stringContaining("_count=50"),
    );
  });
});

describe("given multiple observations", () => {
  let result: HeartRate[];

  beforeEach(async () => {
    medplum.searchResources.mockResolvedValue(
      fromPartial<ResourceArray<Observation>>([
        {
          resourceType: "Observation",
          effectiveDateTime: "2024-01-01T00:00:00.000Z",
          valueQuantity: { value: 72 },
        },
        {
          resourceType: "Observation",
          effectiveDateTime: "2024-01-02T00:00:00.000Z",
          valueQuantity: { value: 80 },
        },
      ]),
    );
    result = await heartRateService.getAll();
  });

  it("should return all mapped heart rates", () => {
    expect(result).toHaveLength(2);
  });

  it("should map each observation correctly", () => {
    expect(result[1]).toEqual({
      timestamp: "2024-01-02T00:00:00.000Z",
      bpm: 80,
    });
  });
});
