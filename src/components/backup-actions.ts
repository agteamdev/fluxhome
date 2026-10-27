import { browser } from 'wxt/browser';
import { el } from './dom';
import { confirmDialog } from './dialog';
import { showToast } from './toast';
import { buildBackup, ImportError, MAX_BACKUP_BYTES, parseBackup } from '@/lib/backup';
import { loadConfig } from '@/lib/config';
import { storage } from '@/lib/storage';
import { downloadTextFile, pickFile } from '@/utils/download';

async function exportBackup(): Promise<void> {
  try {
    const backup = buildBackup(await loadConfig(), browser.runtime.getManifest().version);
    const date = new Date().toISOString().slice(0, 10);
    downloadTextFile(`fluxhome-backup-${date}.json`, JSON.stringify(backup, null, 2));
    showToast('Backup exported');
  } catch (error) {
    console.error(error);
    showToast('Could not export the backup', 'error');
  }
}

async function importBackup(): Promise<void> {
  const file = await pickFile('.json,application/json');
  if (!file) return;
  if (file.size > MAX_BACKUP_BYTES) {
    showToast('This file is too large to be a FluxHome backup', 'error');
    return;
  }

  let result;
  try {
    result = parseBackup(await file.text());
  } catch (error) {
    showToast(error instanceof ImportError ? error.message : 'Could not read the file', 'error');
    return;
  }

  const { stats, dropped } = result;
  const summary = `${stats.pages} page(s), ${stats.bookmarks} bookmark(s), ${stats.notes} note(s), ${stats.todos} todo(s)`;
  const skipped = dropped > 0 ? ` ${dropped} invalid item(s) will be skipped.` : '';
  const ok = await confirmDialog({
    title: 'Replace all data?',
    message: `The backup contains ${summary}.${skipped} Your current data will be replaced. Export it first if you are unsure.`,
    confirmLabel: 'Replace',
  });
  if (!ok) return;

  // Overwrite every key (do not clear first: that would trigger re-initialization with defaults)
  await storage.setMany(result.data);
  showToast('Backup imported');
}

/** "Export" and "Import" buttons shown in the page header. */
export function renderBackupButtons(extra: HTMLElement[] = []): HTMLElement {
  const exportButton = el('button', { class: 'btn', text: 'Export', attrs: { type: 'button', title: 'Download a JSON backup' } });
  const importButton = el('button', { class: 'btn', text: 'Import', attrs: { type: 'button', title: 'Restore from a JSON backup' } });
  exportButton.addEventListener('click', () => void exportBackup());
  importButton.addEventListener('click', () => void importBackup());
  return el('div', { class: 'header-actions' }, [...extra, exportButton, importButton]);
}
