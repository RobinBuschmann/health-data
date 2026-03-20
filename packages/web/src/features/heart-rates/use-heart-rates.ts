import { useQuery } from "@tanstack/react-query";
import { fetchHeartRate } from "./heart-rate";

export const useHeartRates = (patientId: string) =>
  useQuery({
    queryKey: ["heart-rates", patientId],
    queryFn: () => fetchHeartRate(patientId),
    enabled: !!patientId,
  });
