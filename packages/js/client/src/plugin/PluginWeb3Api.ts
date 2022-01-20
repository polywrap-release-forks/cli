import {
  Api,
  Client,
  executeMaybeAsyncFunction,
  filterResults,
  GetManifestOptions,
  InvokeApiOptions,
  InvokeApiResult,
  Plugin,
  PluginPackage,
  Uri,
  AnyManifest,
  ManifestType,
  GetFileOptions,
  Env,
  InvokableModules,
  CancelablePromise,
} from "@web3api/core-js";
import * as MsgPack from "@msgpack/msgpack";
import { Tracer } from "@web3api/tracing-js";

function isValidEnv(env: Record<string, unknown>): boolean {
  return typeof env === "object" && !Array.isArray(env) && env !== null;
}

export class PluginWeb3Api extends Api {
  private _instance: Plugin | undefined;

  constructor(
    private _uri: Uri,
    private _plugin: PluginPackage,
    private _clientEnv?: Env<Uri>
  ) {
    super();

    Tracer.startSpan("PluginWeb3Api: constructor");
    Tracer.setAttribute("input", {
      uri: this._uri,
      plugin: this._plugin,
      clientEnv: this._clientEnv,
    });
    Tracer.endSpan();
  }

  public async getSchema(_client: Client): Promise<string> {
    return Promise.resolve(this._plugin.manifest.schema);
  }

  public async getManifest<T extends ManifestType>(
    _options: GetManifestOptions<T>,
    _client: Client
  ): Promise<AnyManifest<T>> {
    throw Error("client.getManifest(...) is not implemented for Plugins.");
  }

  public async getFile(
    _options: GetFileOptions,
    _client: Client
  ): Promise<ArrayBuffer | string> {
    throw Error("client.getFile(...) is not implemented for Plugins.");
  }

  @Tracer.traceMethod("PluginWeb3Api: invoke")
  public async invoke<TData = unknown>(
    options: InvokeApiOptions<Uri>,
    client: Client
  ): CancelablePromise<InvokeApiResult<TData>> {
    try {
      const { module, method, resultFilter } = options;
      const input = options.input || {};
      const modules = this._getInstance().getModules(client);
      const pluginModule = modules[module];

      if (!pluginModule) {
        throw new Error(`PluginWeb3Api: module "${module}" not found.`);
      }

      if (!pluginModule[method]) {
        throw new Error(`PluginWeb3Api: method "${method}" not found.`);
      }

      let jsInput: Record<string, unknown>;

      // If the input is a msgpack buffer, deserialize it
      if (input instanceof ArrayBuffer) {
        const result = MsgPack.decode(input);

        Tracer.addEvent("msgpack-decoded", result);

        if (typeof result !== "object") {
          throw new Error(
            `PluginWeb3Api: decoded MsgPack input did not result in an object.\nResult: ${result}`
          );
        }

        jsInput = result as Record<string, unknown>;
      } else {
        jsInput = input;
      }

      const onCancelHandler = () => {
        // TODO: check to see if there's been a sub-invocation
        // and if so call cancel on it
      }

      return new CancelablePromise<InvokeApiResult<TData>>(
        (_, __, onCancel) => onCancel(onCancelHandler)
      )
      .then(
        async () => {
          let env = this._getModuleClientEnv(module);
          if (isValidEnv(env)) {
            if (pluginModule["sanitizeEnv"]) {
              env = (await executeMaybeAsyncFunction(
                pluginModule["sanitizeEnv"],
                env,
                client
              )) as Record<string, unknown>;
            }

            this._getInstance().loadEnv(env, module);
          }
        }
      )
      .catch(
        (error) => ({ error })
      )
      .then(
        () => (
          executeMaybeAsyncFunction(
            pluginModule[method],
            jsInput,
            client
          ) as Promise<TData>
        )
      )
      .catch(
        (e) => ({
          error: new Error(
            `PluginWeb3Api: invocation exception encountered.\n` +
              `uri: ${this._uri.uri}\nmodule: ${module}\n` +
              `method: ${method}\nresultFilter: ${resultFilter}\n` +
              `input: ${JSON.stringify(jsInput, null, 2)}\n` +
              `modules: ${JSON.stringify(modules, null, 2)}\n` +
              `exception: ${e.message}`
          )
        })
      )
      .then(
        (result: TData) => {
          Tracer.addEvent("unfiltered-result", result);

          if (result !== undefined) {
            let data = result as unknown;

            if (process.env.TEST_PLUGIN) {
              // try to encode the returned result,
              // ensuring it's msgpack compliant
              try {
                MsgPack.encode(data);
              } catch (e) {
                throw Error(
                  `TEST_PLUGIN msgpack encode failure.` +
                    `uri: ${this._uri.uri}\nmodule: ${module}\n` +
                    `method: ${method}\n` +
                    `input: ${JSON.stringify(jsInput, null, 2)}\n` +
                    `result: ${JSON.stringify(data, null, 2)}\n` +
                    `exception: ${e}`
                );
              }
            }

            if (resultFilter) {
              data = filterResults(result, resultFilter);
            }

            Tracer.addEvent("Filtered result", data);

            return {
              data: data as TData,
            };
          } else {
            return {};
          }
        }
      )
      .catch(
        (error) => ({ error })
      );
    } catch (error) {
      return {
        error,
      };
    }
  }

  private _getInstance(): Plugin {
    this._instance ||= this._plugin.factory();
    return this._instance;
  }

  @Tracer.traceMethod("PluginWeb3Api: getModuleClientEnv")
  private _getModuleClientEnv(
    module: InvokableModules
  ): Record<string, unknown> {
    if (!this._clientEnv) {
      return {};
    }

    if (module === "query") {
      return {
        ...this._clientEnv.common,
        ...this._clientEnv.query,
      };
    } else {
      return {
        ...this._clientEnv.common,
        ...this._clientEnv.mutation,
      };
    }
  }
}
