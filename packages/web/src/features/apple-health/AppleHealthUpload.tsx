import { useRef, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAppleHealthImport } from "./use-apple-health-import.js";

export function AppleHealthUpload() {
  const { mutate, isPending, isSuccess, isError, error } = useAppleHealthImport();
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    mutate(file);
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Import Apple Health Data
      </Typography>
      <Box
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        sx={{
          border: "2px dashed",
          borderColor: isDragOver ? "primary.main" : "grey.400",
          borderRadius: 2,
          p: 4,
          textAlign: "center",
          cursor: "pointer",
          bgcolor: isDragOver ? "action.hover" : "background.paper",
          transition: "all 0.2s",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".zip"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {isPending ? (
          <CircularProgress />
        ) : (
          <Typography color="text.secondary">
            Drop Apple Health export.zip here, or click to select
          </Typography>
        )}
      </Box>
      {isSuccess && (
        <Typography color="success.main" sx={{ mt: 1 }}>
          Import successful!
        </Typography>
      )}
      {isError && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error instanceof Error ? error.message : "Import failed"}
        </Typography>
      )}
    </Box>
  );
}
