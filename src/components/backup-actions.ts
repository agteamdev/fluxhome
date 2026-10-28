import { browser } from 'wxt/browser';
import { confirmDialog } from './dialog';
import { showToast } from './toast';
import { buildBackup, ImportError, MAX_BACKUP_BYTES, parseBackup } from '@/lib/backup';
import { loadConfig } from '@/lib/config';
import { t } from '@/lib/i18n';
import { storage } from '@/lib/storage';
import { downloadTextFile, pickFile } from '@/utils/download';

/** Downloads all data as a JSON backup file. */
export async function exportBackup(): Promise<void> {
  try {
    const backup = buildBackup(await loadConfig(), browser.runtime.getManifest().version);
    const date = new Date().toISOString().slice(0, 10);
    downloadTextFile(`fluxhome-backup-${date}.json`, JSON.stringify(backup, null, 2));
    showToast(t('data.exported'));
  } catch (error) {
    console.error(error);
    showToast(t('data.exportFailed'), 'error');
  }
}

/** Lets the user pick a backup file, shows what is inside and, after confirmation, replaces all data. */
export async function importBackup(): Promise<void> {
  const file = await pickFile('.json,application/json');
  if (!file) return;
  if (file.size > MAX_BACKUP_BYTES) {
    showToast(t('data.tooLarge'), 'error');
    return;
  }

  let result;
  try {
    result = parseBackup(await file.text());
  } catch (error) {
    showToast(error instanceof ImportError ? t(error.key, error.params) : t('data.readFailed'), 'error');
    return;
  }

  const { stats, dropped } = result;
  const ok = await confirmDialog({
    title: t('data.replaceTitle'),
    message: t('data.replaceMessage', {
      pages: stats.pages,
      bookmarks: stats.bookmarks,
      notes: stats.notes,
      todos: stats.todos,
      skipped: dropped > 0 ? ` ${t('data.skipped', { count: dropped })}` : '',
    }),
    confirmLabel: t('data.replace'),
  });
  if (!ok) return;

  // Overwrite every key (do not clear first: that would trigger re-initialization with defaults)
  await storage.setMany(result.data);
  showToast(t('data.imported'));
}
