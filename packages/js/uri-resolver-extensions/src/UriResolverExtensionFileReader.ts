import {
  Client,
  combinePaths,
  InvokeOptions,
  InvokeResult,
  Uri,
  UriResolverInterface,
  Wrapper,
} from "@polywrap/core-js";
import { IFileReader } from "@polywrap/wasm-js";

export class UriResolverExtensionFileReader implements IFileReader {
  constructor(
    private readonly resolverExtensionUri: Uri,
    private readonly wrapperUri: Uri,
    private readonly client: Client
  ) {}

  async readFile(filePath: string): Promise<Uint8Array | undefined> {
    const { data, error } = await UriResolverInterface.module.getFile(
      {
        invoke: <TData = unknown, TUri extends Uri | string = string>(
          options: InvokeOptions<TUri>
        ): Promise<InvokeResult<TData>> =>
          this.client.invoke<TData, TUri>(options),
        invokeWrapper: <TData = unknown, TUri extends Uri | string = string>(
          options: InvokeOptions<TUri> & { wrapper: Wrapper }
        ): Promise<InvokeResult<TData>> =>
          this.client.invokeWrapper<TData, TUri>(options),
      },
      this.resolverExtensionUri,
      combinePaths(this.wrapperUri.path, filePath)
    );

    if (error) {
      throw error;
    }

    return data;
  }
}
