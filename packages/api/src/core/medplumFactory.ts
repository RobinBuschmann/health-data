import { MedplumClient, MedplumClientOptions } from "@medplum/core";

export const medplumFactory = () => {
  const { MEDPLUM_BASE_URL, MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET } = process.env;

  if (!MEDPLUM_CLIENT_ID) {
    throw new Error("MEDPLUM_CLIENT_ID is not set");
  }
  if (!MEDPLUM_CLIENT_SECRET) {
    throw new Error("MEDPLUM_CLIENT_SECRET is not set");
  }

  return new Medplum({
    baseUrl: MEDPLUM_BASE_URL,
    clientId: MEDPLUM_CLIENT_ID,
    clientSecret: MEDPLUM_CLIENT_SECRET,
  });
};

export type MedplumOptions = MedplumClientOptions & {
  clientId: string;
  clientSecret: string;
};
export class Medplum extends MedplumClient {
  protected _clientId: string;
  protected _clientSecret: string;
  constructor(options: MedplumOptions) {
    super(options);
    this._clientId = options.clientId;
    this._clientSecret = options.clientSecret;
  }
  startClientLogin() {
    return super.startClientLogin(this._clientId, this._clientSecret);
  }
}
