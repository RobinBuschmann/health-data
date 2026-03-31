import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";
import * as k8s from "@pulumi/kubernetes";

export interface ApiServiceArgs {
  replicas?: number;
  provider?: k8s.Provider;
  image?: string;
}

export class ApiService extends pulumi.ComponentResource {
  public readonly deployment: k8s.apps.v1.Deployment;
  public readonly service: k8s.core.v1.Service;

  constructor(name: string, args: ApiServiceArgs, opts?: pulumi.ComponentResourceOptions) {
    super("health-data:infra:ApiService", name, {}, opts);
    const childOpts = { parent: this };
    const k8sOpts = args.provider
      ? { parent: this, provider: args.provider }
      : { parent: this };

    const isLocal = args.image !== undefined;

    const imageUri: pulumi.Input<string> = isLocal
      ? args.image!
      : new awsx.ecr.Image(
          name,
          {
            repositoryUrl: new awsx.ecr.Repository(name, { forceDelete: true }, childOpts).url,
            context: "../..",
            dockerfile: "../../packages/api/Dockerfile",
            platform: "linux/amd64",
          },
          childOpts,
        ).imageUri;

    const labels = { app: name };

    const namespace = new k8s.core.v1.Namespace(name, { metadata: { name } }, k8sOpts);

    this.deployment = new k8s.apps.v1.Deployment(
      name,
      {
        metadata: { namespace: namespace.metadata.name },
        spec: {
          replicas: args.replicas ?? 1,
          selector: { matchLabels: labels },
          template: {
            metadata: { labels },
            // Pod spec
            spec: {
              containers: [
                {
                  name,
                  image: imageUri,
                  imagePullPolicy: isLocal ? "Never" : "Always",
                  ports: [{ containerPort: 3000 }],
                },
              ],
            },
          },
        },
      },
      k8sOpts,
    );

    this.service = new k8s.core.v1.Service(
      name,
      {
        metadata: { namespace: namespace.metadata.name },
        spec: {
          selector: labels,
          ports: [{ port: 80, targetPort: 3000 }],
        },
      },
      k8sOpts,
    );

    this.registerOutputs({ deployment: this.deployment, service: this.service });
  }
}
