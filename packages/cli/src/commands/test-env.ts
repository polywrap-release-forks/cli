import { startupTestEnv, shutdownTestEnv } from "../lib/env/test";

import { GluegunToolbox, print } from "gluegun";
import chalk from "chalk";
import { withSpinner } from "../lib/helpers/spinner";

const HELP = `
${chalk.bold('w3 test-env')} [command]

Commands:
  up    Startup the test env
  down  Shutdown the test env
`;

export default {
  alias: ["t"],
  description: "Manage a test environment for Web3API",
  run: async (toolbox: GluegunToolbox) => {
    const { parameters } = toolbox;
    const command = parameters.first;

    if (!command) {
      print.error("No command given");
      print.info(HELP);
      return;
    }

    if (command !== "up" && command !== "down") {
      print.error(`Unrecognized command: ${command}`);
      print.info(HELP);
      return;
    }

    if (command === "up") {
      return await withSpinner(
        "Starting test environment...",
        "Failed to start test environment",
        "Warning starting test environment",
        async apinner => {
          return startupTestEnv();
        }
      )
    } else if (command === "down") {
      return await withSpinner(
        "Shutting down test environment...",
        "Failed to shutdown test environment",
        "Warning shutting down test environment",
        async apinner => {
          return await shutdownTestEnv();
        }
      )
    } else {
      throw Error("This should never happen...");
    }
  }
}
