import type { Observation, Patient } from "@medplum/fhirtypes";

interface LoincMapping {
  code: string;
  display: string;
  ucumUnit: string;
}

const HK_TO_LOINC: Record<string, LoincMapping> = {
  HKQuantityTypeIdentifierHeartRate: {
    code: "8867-4",
    display: "Heart rate",
    ucumUnit: "/min",
  },
  HKQuantityTypeIdentifierRestingHeartRate: {
    code: "40443-4",
    display: "Resting heart rate",
    ucumUnit: "/min",
  },
  HKQuantityTypeIdentifierStepCount: {
    code: "55423-8",
    display: "Number of steps",
    ucumUnit: "steps",
  },
  HKQuantityTypeIdentifierBodyMass: {
    code: "29463-7",
    display: "Body weight",
    ucumUnit: "kg",
  },
  HKQuantityTypeIdentifierHeight: {
    code: "8302-2",
    display: "Body height",
    ucumUnit: "cm",
  },
  HKQuantityTypeIdentifierBloodPressureSystolic: {
    code: "8480-6",
    display: "Systolic blood pressure",
    ucumUnit: "mm[Hg]",
  },
  HKQuantityTypeIdentifierBloodPressureDiastolic: {
    code: "8462-4",
    display: "Diastolic blood pressure",
    ucumUnit: "mm[Hg]",
  },
  HKQuantityTypeIdentifierOxygenSaturation: {
    code: "59408-5",
    display: "Oxygen saturation in Arterial blood by Pulse oximetry",
    ucumUnit: "%",
  },
  HKQuantityTypeIdentifierBodyTemperature: {
    code: "8310-5",
    display: "Body temperature",
    ucumUnit: "Cel",
  },
  HKQuantityTypeIdentifierBloodGlucose: {
    code: "15074-8",
    display: "Glucose [Moles/volume] in Blood",
    ucumUnit: "mmol/L",
  },
};

export interface AppleHealthRecord {
  type: string;
  sourceName: string;
  unit: string;
  startDate: string;
  value: string;
}

export interface AppleHealthMe {
  dateOfBirth?: string;
  biologicalSex?: string;
}

export type AppleHealthMapperOptions = Record<never, never>;
export type AppleHealthMapper = ReturnType<typeof appleHealthMapperFactory>;

export const appleHealthMapperFactory = (_options: AppleHealthMapperOptions = {}) => ({
  isSupportedRecord(record: object): record is AppleHealthRecord {
    return "type" in record && typeof record.type === "string" && record.type in HK_TO_LOINC;
  },

  mapRecord(record: AppleHealthRecord, patientRef: string): Observation {
    const mapping = HK_TO_LOINC[record.type];
    return {
      resourceType: "Observation",
      status: "final",
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: mapping.code,
            display: mapping.display,
          },
        ],
      },
      subject: { reference: patientRef },
      effectiveDateTime: new Date(record.startDate).toISOString(),
      valueQuantity: {
        value: parseFloat(record.value),
        unit: record.unit,
        system: "http://unitsofmeasure.org",
        code: mapping.ucumUnit,
      },
    };
  },

  mapPatient(me: AppleHealthMe): Patient {
    return {
      resourceType: "Patient",
      ...(me.dateOfBirth && { birthDate: me.dateOfBirth }),
      ...(me.biologicalSex && {
        gender:
          me.biologicalSex === "HKBiologicalSexMale"
            ? "male"
            : me.biologicalSex === "HKBiologicalSexFemale"
              ? "female"
              : "unknown",
      }),
    };
  },
});
