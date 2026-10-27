import { SCHEMA_VERSION } from './types';

type Data = Record<string, unknown>;
type Migration = (data: Data) => Data;

/**
 * Schema migrations. Key N is a function that upgrades data from version N to N+1.
 * When the schema changes: bump SCHEMA_VERSION in types.ts and add a function here.
 *
 * Example for the future (version 1 -> 2):
 *   1: (d) => ({ ...d, newField: 'value' }),
 */
export const migrations: Record<number, Migration> = {};

export function migrateData(data: Data, fromVersion: number): Data {
  let current = fromVersion;
  let result = data;
  if (current > SCHEMA_VERSION) {
    throw new Error(
      `Data was created by a newer FluxHome version (schema ${current}, supported ${SCHEMA_VERSION}). Please update the extension.`,
    );
  }
  while (current < SCHEMA_VERSION) {
    const step = migrations[current];
    if (!step) throw new Error(`No migration from schema ${current} to ${current + 1}`);
    result = step(result);
    current += 1;
  }
  return { ...result, schemaVersion: SCHEMA_VERSION };
}
