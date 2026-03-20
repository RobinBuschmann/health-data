import { z } from "zod";

export const heartRateSchema = z.object({
  timestamp: z.iso.datetime(),
  bpm: z.number(),
});

export type HeartRate = z.infer<typeof heartRateSchema>;
