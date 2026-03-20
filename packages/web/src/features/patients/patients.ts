import { get } from "../../core/http/client";

export type Patient = {
  id: string;
  birthDate?: string;
  gender?: "male" | "female" | "unknown" | "other";
};

export const fetchPatients = () => get<Patient[]>("/patients");
