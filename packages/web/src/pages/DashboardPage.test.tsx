import { beforeAll, beforeEach, afterEach, afterAll, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { ReactNode } from "react";
import { DashboardPage } from "./DashboardPage";
import type { Patient } from "../features/patients/patients";
import type { HeartRate } from "../features/heart-rates/heart-rate";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function Wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>;
}

describe("given the API returns no patients", () => {
  beforeEach(() => {
    server.use(http.get("http://localhost:3000/patients", () => HttpResponse.json<Patient[]>([])));
    render(<DashboardPage />, { wrapper: Wrapper });
  });

  it("should show a loading indicator for heart rates", () => {
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});

describe("given the API returns patients and heart rates", () => {
  const patients: Patient[] = [{ id: "p1", gender: "male", birthDate: "1990-01-15" }];
  const heartRates: HeartRate[] = [{ timestamp: "2024-01-01T00:00:00.000Z", bpm: 72 }];

  beforeEach(async () => {
    server.use(
      http.get("http://localhost:3000/patients", () => HttpResponse.json(patients)),
      http.get("http://localhost:3000/heart-rates", () => HttpResponse.json(heartRates)),
    );
    render(<DashboardPage />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
  });

  it("should show the Health Dashboard heading", () => {
    expect(screen.getByText("Health Dashboard")).toBeInTheDocument();
  });

  it("should show the Apple Health upload section", () => {
    expect(
      screen.getByText("Drop Apple Health export.zip here, or click to select"),
    ).toBeInTheDocument();
  });

  it("should fetch heart rates for the first patient", () => {
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
