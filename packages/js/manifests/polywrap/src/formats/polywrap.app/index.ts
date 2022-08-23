/* eslint-disable */
/**
 * This file was automatically generated by scripts/manifest/index-ts.mustache.
 * DO NOT MODIFY IT BY HAND. Instead, modify scripts/manifest/index-ts.mustache,
 * and run node ./scripts/manifest/generateFormatTypes.js to regenerate this file.
 */

import {
  AppManifest as AppManifest_0_1_0,
} from "./0.1.0";
import {
  AppManifest as AppManifest_0_2_0,
} from "./0.2.0";

export {
  AppManifest_0_1_0,
  AppManifest_0_2_0,
};

export enum AppManifestFormats {
  // NOTE: Patch fix for backwards compatability
  "v0.1" = "0.1",
  "v0.1.0" = "0.1.0",
  "v0.2.0" = "0.2.0",
}

export type AnyAppManifest =
  | AppManifest_0_1_0
  | AppManifest_0_2_0



export type AppManifest = AppManifest_0_2_0;

export const latestAppManifestFormat = AppManifestFormats["v0.2.0"]

export { migrateAppManifest } from "./migrate";

export { deserializeAppManifest } from "./deserialize";

export { validateAppManifest } from "./validate";
