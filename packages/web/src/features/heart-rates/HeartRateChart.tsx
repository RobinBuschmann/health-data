import { LineChart } from "@mui/x-charts/LineChart";
import type { HeartRate } from "./heart-rate";

type HeartRateChartProps = {
  data: HeartRate[];
};

export function HeartRateChart({ data }: HeartRateChartProps) {
  const timestamps = data.map((d) => new Date(d.timestamp));
  const bpmValues = data.map((d) => d.bpm);

  return (
    <LineChart
      xAxis={[{ data: timestamps, scaleType: "time", label: "Date" }]}
      series={[{ data: bpmValues, label: "Heart Rate (bpm)", color: "#e53935" }]}
      height={400}
    />
  );
}
