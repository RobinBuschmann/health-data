import { z } from "zod";

export const patientSchema = z.object({
  id: z.string(),
  birthDate: z.iso.date().optional(),
  gender: z.enum(["male", "female", "unknown", "other"]).optional(),
});

export type Patient = z.infer<typeof patientSchema>;
