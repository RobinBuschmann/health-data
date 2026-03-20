import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post } from "../../core/http/client.js";

export function useAppleHealthImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return post("/apple-health/import", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
