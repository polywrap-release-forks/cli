import { clearStyle, w3Cli } from "./utils";

import { runCLI } from "@web3api/test-env-js";

const HELP = `
  w3             🔥 Web3API CLI 🔥                           
  help (h)       -                                         
  test-env (t)   Manage a test environment for Web3API     
  query (q)      Query Web3APIs using recipe scripts       
  plugin (p)     Build/generate types for the plugin       
  docgen (d)     Build/generate documentation for your app 
  deploy (b)     Deploys/Publishes a Web3API               
  create (c)     Create a new project with w3 CLI          
  codegen (g)    Auto-generate API Types                   
  build (b)      Builds a Web3API                          
  app (a)        Build/generate types for your app         
`;

describe("e2e tests for no help", () => {

  test("Should display the help content", async () => {
    const { exitCode: code, stdout: output, stderr: error } = await runCLI({
      args: ["help"],
      cli: w3Cli,
    });

    expect(code).toEqual(0);
    expect(error).toBe("");
    expect(clearStyle(output)).toContain(HELP);
  });
});
