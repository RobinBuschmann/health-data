import type { Patient as FhirPatient } from "@medplum/fhirtypes";
import type { Medplum } from "../core/medplumFactory.js";
import type { Patient } from "./patient-dtos.js";

type PatientServiceOptions = {
  medplum: Medplum;
};

export type PatientService = ReturnType<typeof patientServiceFactory>;
export const patientServiceFactory = ({ medplum }: PatientServiceOptions) => ({
  async getAll(): Promise<Patient[]> {
    const patients = await medplum.searchResources("Patient", {});
    return patients.map(mapToPatient);
  },
});

function mapToPatient(patient: FhirPatient): Patient {
  if (!patient.id) {
    throw new Error("Patient id is missing");
  }
  return {
    id: patient.id,
    birthDate: patient.birthDate,
    gender: patient.gender,
  };
}
