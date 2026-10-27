import { storage } from './storage';
import { createDefaultData } from './defaults';
import { migrateData } from './migrations';
import { SCHEMA_VERSION, type StorageSchema } from './types';

/**
 * Makes sure storage holds up-to-date data:
 *  - first run   -> write default values
 *  - old schema  -> run migrations
 */
export async function initStorage(): Promise<void> {
  const all = await storage.getAll();

  if (all.schemaVersion === undefined || !all.pages || all.pages.length === 0) {
    await storage.setMany(createDefaultData());
    return;
  }

  if (all.schemaVersion < SCHEMA_VERSION) {
    const migrated = migrateData(all as Record<string, unknown>, all.schemaVersion);
    await storage.setMany(migrated as Partial<StorageSchema>);
  }
}

/** Loads the full configuration (runs initStorage first). */
export async function loadConfig(): Promise<StorageSchema> {
  await initStorage();
  return (await storage.getAll()) as StorageSchema;
}
