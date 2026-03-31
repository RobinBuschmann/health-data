import * as pulumi from "@pulumi/pulumi";
import { describe, it, expect } from "vitest";

pulumi.runtime.setMocks({
  newResource: (args) => ({ id: `${args.name}-id`, state: args.inputs }),
  call: (args) => ({ outputs: args.inputs }),
});

const { deployment, service } = await import("./api-service.js").then(
  ({ ApiService }) =>
    new ApiService("api", {
      provider: {} as any,
    }),
);

describe("deployment", () => {
  it("should expose port 3000", async () => {
    const containers = await new Promise<any[]>((resolve) =>
      deployment.spec.template.spec.containers.apply(resolve),
    );
    expect(containers[0].ports[0].containerPort).toBe(3000);
  });
});

describe("service", () => {
  it("should target port 3000", async () => {
    const ports = await new Promise<any[]>((resolve) =>
      service.spec.ports.apply(resolve),
    );
    expect(ports[0].targetPort).toBe(3000);
  });
});
