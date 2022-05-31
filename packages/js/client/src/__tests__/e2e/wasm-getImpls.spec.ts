import {
  buildApi,
  initTestEnvironment,
  stopTestEnvironment,
} from "@web3api/test-env-js";
import { createWeb3ApiClient, Web3ApiClientConfig } from "../..";
import { GetPathToTestApis } from "@web3api/test-cases";

jest.setTimeout(200000);

describe("wasm-getImpls", () => {
  let ipfsProvider: string;
  let ethProvider: string;
  let ensAddress: string;

  const interfaceUri = "w3://ens/interface.eth"
  const implementationPath = `${GetPathToTestApis()}/implementations/test-use-getImpl`
  const implementationUri = `w3://fs/${implementationPath}/build`

  beforeAll(async () => {
    const { ipfs, ethereum, ensAddress: ens } = await initTestEnvironment();
    ipfsProvider = ipfs;
    ethProvider = ethereum;
    ensAddress = ens;

    await buildApi(implementationPath);
  });

  afterAll(async () => {
    await stopTestEnvironment();
  });

  const getClient = async (config?: Partial<Web3ApiClientConfig>) => {
    return createWeb3ApiClient(
      {
        ethereum: {
          networks: {
            testnet: {
              provider: ethProvider,
            },
          },
        },
        ipfs: { provider: ipfsProvider },
        ens: {
          query: {
           addresses: {
              testnet: ensAddress,
            },
          },
        },
      },
      config
    );
  };


  it("e2e getImplementations capability", async () => {
    const client = await getClient({
      interfaces: [
        {
          interface: interfaceUri,
          implementations: [implementationUri],
        },
      ],
    });

    expect(client.getImplementations(interfaceUri)).toEqual([
      implementationUri,
    ]);

    const query = await client.query<{
      queryMethod: string;
      abstractQueryMethod: string;
    }>({
      uri: implementationUri,
      query: `
        query {
          queryImplementations
        }
      `,
      variables: {},
    });

    expect(query.errors).toBeFalsy();
    expect(query.data).toBeTruthy();
    expect((query.data as any).queryImplementations).toEqual([
      implementationUri,
    ]);
  });
});