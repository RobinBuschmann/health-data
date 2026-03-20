import { useQuery } from "@tanstack/react-query";
import { fetchPatients } from "./patients";

export const usePatients = () =>
  useQuery({
    queryKey: ["patients"],
    queryFn: fetchPatients,
  });
