import { beforeAll, beforeEach, afterEach, afterAll, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { ReactNode } from "react";
import { AppleHealthUpload } from "./AppleHealthUpload";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  );
}

const exportZip = new File(["zip content"], "export.zip", {
  type: "application/zip",
});

describe("given the upload succeeds", () => {
  beforeEach(async () => {
    server.use(
      http.post(
        "http://localhost:3000/apple-health/import",
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    render(<AppleHealthUpload />, { wrapper: Wrapper });
    const input = document.querySelector('input[type="file"]')!;
    await userEvent.upload(input as unknown as HTMLElement, exportZip);
  });

  it("should show the success message", async () => {
    expect(await screen.findByText("Import successful!")).toBeInTheDocument();
  });
});

describe("given the upload fails", () => {
  beforeEach(async () => {
    server.use(
      http.post(
        "http://localhost:3000/apple-health/import",
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    render(<AppleHealthUpload />, { wrapper: Wrapper });
    const input = document.querySelector('input[type="file"]')!;
    await userEvent.upload(input as unknown as HTMLElement, exportZip);
  });

  it("should show an error message", async () => {
    expect(await screen.findByText("API error: 500")).toBeInTheDocument();
  });
});
