import { browser } from 'wxt/browser';
import type { StorageKey, StorageSchema } from './types';

/**
 * Wrapper around browser.storage.local.
 * The rest of the project must access storage ONLY through this object.
 */
type Change = { newValue?: unknown; oldValue?: unknown };

export const storage = {
  async get<K extends StorageKey>(key: K): Promise<StorageSchema[K] | undefined> {
    const res = await browser.storage.local.get(key);
    return res[key] as StorageSchema[K] | undefined;
  },

  async set<K extends StorageKey>(key: K, value: StorageSchema[K]): Promise<void> {
    await browser.storage.local.set({ [key]: value });
  },

  async remove(key: StorageKey): Promise<void> {
    await browser.storage.local.remove(key);
  },

  /** Everything stored (used for export). */
  async getAll(): Promise<Partial<StorageSchema>> {
    return (await browser.storage.local.get(null)) as Partial<StorageSchema>;
  },

  /** Write several keys at once (used for import). */
  async setMany(values: Partial<StorageSchema>): Promise<void> {
    await browser.storage.local.set(values);
  },

  /** Subscribe to changes of a key. Returns an unsubscribe function. */
  watch<K extends StorageKey>(
    key: K,
    callback: (newValue: StorageSchema[K] | undefined, oldValue: StorageSchema[K] | undefined) => void,
  ): () => void {
    const listener = (changes: Record<string, Change>, area: string) => {
      if (area !== 'local' || !(key in changes)) return;
      const c = changes[key]!;
      callback(c.newValue as StorageSchema[K] | undefined, c.oldValue as StorageSchema[K] | undefined);
    };
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  },
};
