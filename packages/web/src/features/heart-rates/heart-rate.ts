import { get } from "../../core/http/client";

export type HeartRate = {
  timestamp: string;
  bpm: number;
};

export const fetchHeartRate = (patientId: string) =>
  get<HeartRate[]>("/heart-rates", { patientId });
