import { useState } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { PatientSelect } from "../features/patients/PatientSelect";
import { HeartRateChart } from "../features/heart-rates/HeartRateChart";
import { usePatients } from "../features/patients/use-patients";
import { useHeartRates } from "../features/heart-rates/use-heart-rates";
import { AppleHealthUpload } from "../features/apple-health/AppleHealthUpload";

export function DashboardPage() {
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const { data: patients = [] } = usePatients();
  const effectivePatientId = selectedPatientId || patients[0]?.id || "";
  const { data: heartRates = [], isPending } = useHeartRates(effectivePatientId);

  return (
    <Box sx={{ p: 4 }}>
      <Stack spacing={4}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">Health Dashboard</Typography>
          <PatientSelect
            patients={patients}
            value={effectivePatientId}
            onChange={setSelectedPatientId}
          />
        </Stack>

        <Box>
          <Typography variant="h6" gutterBottom>
            Heart Rate
          </Typography>
          {isPending ? <CircularProgress /> : <HeartRateChart data={heartRates} />}
        </Box>

        <AppleHealthUpload />
      </Stack>
    </Box>
  );
}
