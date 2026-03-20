import { FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from "@mui/material";
import type { Patient } from "./patients";

type PatientSelectProps = {
  patients: Patient[];
  value: string;
  onChange: (patientId: string) => void;
};

export function PatientSelect({ patients, value, onChange }: PatientSelectProps) {
  const handleChange = (event: SelectChangeEvent) => onChange(event.target.value);

  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <InputLabel>Patient</InputLabel>
      <Select value={value} label="Patient" onChange={handleChange}>
        {patients.map((patient) => (
          <MenuItem key={patient.id} value={patient.id}>
            {patient.gender ?? "Unknown"} · {patient.birthDate ?? "No DOB"}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
