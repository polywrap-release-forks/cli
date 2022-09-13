/* eslint-disable */
/**
 * This file was automatically generated by scripts/manifest/index-ts.mustache.
 * DO NOT MODIFY IT BY HAND. Instead, modify scripts/manifest/index-ts.mustache,
 * and run node ./scripts/manifest/generateFormatTypes.js to regenerate this file.
 */

import {
  MetaManifest as MetaManifest_0_1_0,
} from "./0.1.0";

export {
  MetaManifest_0_1_0,
};

export enum MetaManifestFormats {
  // NOTE: Patch fix for backwards compatability
  "v0.1" = "0.1",
  "v0.1.0" = "0.1.0",
}

export const MetaManifestSchemaFiles: Record<string, string> = {
  "0.1.0": "formats/polywrap.meta/0.1.0.json",
}

export type AnyMetaManifest =
  | MetaManifest_0_1_0



export type MetaManifest = MetaManifest_0_1_0;

export const latestMetaManifestFormat = MetaManifestFormats["v0.1.0"]

export { migrateMetaManifest } from "./migrate";

export { deserializeMetaManifest } from "./deserialize";

export { validateMetaManifest } from "./validate";
