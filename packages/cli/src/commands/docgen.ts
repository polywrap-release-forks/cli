/* eslint-disable prefer-const */
import {
  AnyManifest,
  AppProject,
  CodeGenerator,
  defaultAppManifest,
  defaultWeb3ApiManifest,
  getSimpleClient,
  getTestEnvProviders,
  Project,
  resolvePathIfExists,
  SchemaComposer,
  Web3ApiProject,
  intlMsg,
  fixParameters,
  generateProjectTemplate,
} from "../lib";

import { GluegunToolbox, GluegunPrint } from "gluegun";
import chalk from "chalk";
import path from "path";
import { Web3ApiClient } from "@web3api/client-js";

interface DocumentationCommands extends Record<string, string> {
  html: string;
  jsdoc: string;
  docusaurus: string;
  "docusaurus-react": string;
}

const commands: DocumentationCommands = {
  html: "@web3api/schema-bind/build/bindings/documentation/html/index.js",
  jsdoc: "@web3api/schema-bind/build/bindings/documentation/jsdoc/index.js",
  docusaurus:
    "@web3api/schema-bind/build/bindings/documentation/docusaurus/index.js",
  "docusaurus-react":
    "@web3api/schema-bind/build/bindings/documentation/docusaurus/index.js",
};

const defaultManifest = defaultWeb3ApiManifest.concat(defaultAppManifest);
const defaultManifestStr = defaultManifest.join(" | ");
const defaultOutputDir = "./w3";
const outputDirStr = `${intlMsg.commands_docgen_options_c({
  default: `${defaultOutputDir}/`,
})}`;
const genFileOp = "doc-format";
const optionsStr = intlMsg.commands_options_options();
const nodeStr = intlMsg.commands_codegen_options_i_node();
const pathStr = intlMsg.commands_codegen_options_o_path();
const addrStr = intlMsg.commands_codegen_options_e_address();

const HELP = `
${chalk.bold("w3 docgen")} ${chalk.bold(`[<${genFileOp}>]`)} [${optionsStr}]

${intlMsg.commands_docgen_supported()}:
  html (single-page site)
  jsdoc (markdown)
  docusaurus (markdown)
  docusaurus-react (styled react app)

${optionsStr[0].toUpperCase() + optionsStr.slice(1)}:
  -h, --help                              ${intlMsg.commands_codegen_options_h()}
  -m, --manifest-file <${pathStr}>              ${intlMsg.commands_docgen_options_m(
  { default: defaultManifestStr }
)}
  -c, --codegen-dir <${pathStr}>                ${outputDirStr}
  -i, --ipfs [<${nodeStr}>]                     ${intlMsg.commands_codegen_options_i()}
  -e, --ens [<${addrStr}>]                   ${intlMsg.commands_codegen_options_e()}
`;

export default {
  alias: ["d"],
  description: intlMsg.commands_docgen_description(),
  run: async (toolbox: GluegunToolbox): Promise<void> => {
    const { filesystem, parameters, print } = toolbox;

    const { h, m, i, o: c, e } = parameters.options;
    let { help, manifestFile, ipfs, codegenDir, ens } = parameters.options;

    help = help || h;
    manifestFile = manifestFile || m;
    ipfs = ipfs || i;
    codegenDir = codegenDir || c;
    ens = ens || e;

    let command = "";
    try {
      const params = parameters;
      [command] = fixParameters(
        {
          options: params.options,
          array: params.array,
        },
        {
          h,
          help,
        }
      );
    } catch (e) {
      print.error(e.message);
      process.exitCode = 1;
      return;
    }

    // Validate Params
    const paramsValid = validateDocgenParams(
      print,
      command,
      codegenDir,
      ipfs,
      ens
    );

    if (help || !paramsValid) {
      print.info(HELP);
      if (!paramsValid) {
        process.exitCode = 1;
      }
      return;
    }

    // Resolve manifest
    let manifestPaths = manifestFile
      ? [manifestFile]
      : defaultWeb3ApiManifest.concat(defaultAppManifest);
    manifestFile = resolvePathIfExists(filesystem, manifestPaths);

    if (!manifestFile) {
      print.error(
        intlMsg.commands_app_error_manifestNotFound({
          paths: manifestPaths.join(", "),
        })
      );
      return;
    }

    const isAppManifest: boolean =
      (<string>manifestFile).toLowerCase().includes("web3Api.app.yaml") ||
      (<string>manifestFile).toLowerCase().includes("web3Api.app.yml");

    // Resolve custom script
    const customScript = require.resolve(commands[command]);

    // Get providers
    const { ipfsProvider, ethProvider } = await getTestEnvProviders(ipfs);
    const ensAddress: string | undefined = ens;

    // App or Web3Api project
    let project: Project<AnyManifest>;
    if (isAppManifest) {
      const client: Web3ApiClient = getSimpleClient({
        ensAddress,
        ethProvider,
        ipfsProvider,
      });
      project = new AppProject({
        rootCacheDir: path.dirname(manifestFile),
        appManifestPath: manifestFile,
        client,
      });
    } else {
      project = new Web3ApiProject({
        rootCacheDir: path.dirname(manifestFile),
        web3apiManifestPath: manifestFile,
        quiet: true,
      });
    }
    await project.validate();

    // Resolve output directory
    if (codegenDir) {
      codegenDir = filesystem.resolve(codegenDir);
    } else {
      codegenDir = filesystem.resolve(defaultOutputDir);
    }

    const schemaComposer = new SchemaComposer({
      project,
      ipfsProvider,
      ethProvider,
      ensAddress,
    });

    if (command === "docusaurus-react") {
      const projectDir = path.join(codegenDir, "docusaurus-react-app");
      try {
        await generateProjectTemplate(
          "app",
          "docusaurus",
          projectDir,
          filesystem
        );
      } catch (err) {
        const commandFailError = intlMsg.commands_create_error_commandFail({
          error: err.command,
        });
        print.error(commandFailError);
        process.exitCode = 1;
        return;
      }
      codegenDir = path.join(projectDir, "docs/wrapper");
    }

    const codeGenerator = new CodeGenerator({
      project,
      schemaComposer,
      customScript,
      outputDir: codegenDir,
      omitHeader: true,
    });

    if (await codeGenerator.generate()) {
      print.success(`🔥 ${intlMsg.commands_codegen_success()} 🔥`);
      process.exitCode = 0;
    } else {
      process.exitCode = 1;
    }
  },
};

function validateDocgenParams(
  print: GluegunPrint,
  command: unknown,
  codegenDir: unknown,
  ipfs: unknown,
  ens: unknown
): boolean {
  if (!command || typeof command !== "string") {
    print.error(intlMsg.commands_plugin_error_noCommand());
    return false;
  } else if (Object.keys(commands).indexOf(command) === -1) {
    print.error(intlMsg.commands_app_error_unknownCommand({ command }));
    return false;
  }

  if (codegenDir === true) {
    const codegenDirMissingPathMessage = intlMsg.commands_app_error_optionMissingArgument(
      {
        option: "--codegen-dir",
        argument: `<${pathStr}>`,
      }
    );
    print.error(codegenDirMissingPathMessage);
    return false;
  }

  if (ipfs === true) {
    const ipfsMissingMessage = intlMsg.commands_app_error_optionMissingArgument(
      {
        option: "--ipfs",
        argument: `[<${nodeStr}>]`,
      }
    );
    print.error(ipfsMissingMessage);
    return false;
  }

  if (ens === true) {
    const ensAddressMissingMessage = intlMsg.commands_app_error_optionMissingArgument(
      {
        option: "--ens",
        argument: `[<${addrStr}>]`,
      }
    );
    print.error(ensAddressMissingMessage);
    return false;
  }

  return true;
}
