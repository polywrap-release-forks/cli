/* eslint-disable */
/**
 * This file was automatically generated by scripts/manifest/migrate-ts.mustache.
 * DO NOT MODIFY IT BY HAND. Instead, modify scripts/manifest/migrate-ts.mustache,
 * and run node ./scripts/manifest/generateFormatTypes.js to regenerate this file.
 */
import {
  AnyPolywrapManifest,
  PolywrapManifest,
  PolywrapManifestFormats,
  latestPolywrapManifestFormat
} from ".";

import {
  migrate as migrate_0_1_to_0_2
} from "./migrators/0.1_to_0.2";

type Migrator = {
  [key in PolywrapManifestFormats]?: (m: AnyPolywrapManifest) => PolywrapManifest;
};

export const migrators: Migrator = {
  "0.1": migrate_0_1_to_0_2,
};

export function migratePolywrapManifest(
  manifest: AnyPolywrapManifest,
  to: PolywrapManifestFormats
): PolywrapManifest {
  const from = manifest.format as PolywrapManifestFormats;

  if (from === latestPolywrapManifestFormat) {
    return manifest as PolywrapManifest;
  }

  if (!(from in PolywrapManifestFormats)) {
    throw new Error(`Unrecognized PolywrapManifestFormat "${manifest.format}"`);
  }

  const migrator = migrators[from];
  if (!migrator) {
    throw new Error(
      `Migrator from PolywrapManifestFormat "${from}" to "${to}" is not available`
    );
  }

  return migrator(manifest);
}
