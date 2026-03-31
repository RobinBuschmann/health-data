import * as pulumi from "@pulumi/pulumi";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";

export interface ClusterArgs {
  instanceType?: string;
  desiredCapacity?: number;
  minSize?: number;
  maxSize?: number;
}

export class Cluster extends pulumi.ComponentResource {
  public readonly kubeconfig: pulumi.Output<any>;
  public readonly provider: k8s.Provider;

  constructor(name: string, args: ClusterArgs = {}, opts?: pulumi.ComponentResourceOptions) {
    super("health-data:infra:Cluster", name, {}, opts);

    const cluster = new eks.Cluster(
      name,
      {
        instanceType: args.instanceType ?? "t3.medium",
        desiredCapacity: args.desiredCapacity ?? 2,
        minSize: args.minSize ?? 1,
        maxSize: args.maxSize ?? 3,
      },
      { parent: this },
    );

    this.kubeconfig = cluster.kubeconfig;
    this.provider = cluster.provider;

    this.registerOutputs({ kubeconfig: this.kubeconfig });
  }
}
