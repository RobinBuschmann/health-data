import * as pulumi from "@pulumi/pulumi";
import { Cluster } from "./cluster.js";
import { ApiService } from "./api-service.js";

const config = new pulumi.Config();
const replicas = config.getNumber("replicas") ?? 1;
const isLocal = pulumi.getStack() === "local";

const cluster = isLocal ? undefined : new Cluster("health-data");

const apiService = new ApiService("api", {
  replicas,
  provider: cluster?.provider,
  image: isLocal ? "health-data-api:local" : undefined,
});

export const kubeconfig = cluster?.kubeconfig;
