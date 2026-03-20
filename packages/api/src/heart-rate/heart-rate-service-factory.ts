import type { Observation } from "@medplum/fhirtypes";
import type { HeartRate } from "./heart-rate-dtos.js";
import { Medplum } from "../core/medplumFactory.js";

const HEART_RATE_LOINC_CODE = "http://loinc.org|8867-4";

type HeartRateServiceOptions = {
  medplum: Medplum;
};

export type HeartRateService = ReturnType<typeof heartRateServiceFactory>;
export const heartRateServiceFactory = ({ medplum }: HeartRateServiceOptions) => ({
  async getAll(
    patientId?: string,
    from?: string,
    to?: string,
    sort: "asc" | "desc" = "asc",
    limit: number = 100,
  ): Promise<HeartRate[]> {
    const params = new URLSearchParams({
      code: HEART_RATE_LOINC_CODE,
      _sort: sort === "desc" ? "-date" : "date",
      _count: String(limit),
    });
    if (patientId) params.append("patient", patientId);
    if (from) params.append("date", `ge${from}`);
    if (to) params.append("date", `le${to}`);

    const observations = await medplum.searchResources("Observation", params.toString());
    return observations.map(mapToHeartRate);
  },
});

function mapToHeartRate(observation: Observation): HeartRate {
  return {
    timestamp: observation.effectiveDateTime!,
    bpm: observation.valueQuantity!.value!,
  };
}
