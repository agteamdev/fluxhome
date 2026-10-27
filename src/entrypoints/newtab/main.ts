import '@/assets/theme.css';
import './style.css';
import { loadConfig } from '@/lib/config';
import { storage } from '@/lib/storage';
import { renderPage } from '@/components/page';
import { registerSearchShortcut } from '@/components/search-bar';

const app = document.getElementById('app')!;

async function refresh(): Promise<void> {
  renderPage(app, await loadConfig());
}

registerSearchShortcut();
refresh();

// Re-render when data changes (another tab, import, etc.)
for (const key of ['settings', 'pages', 'activePageId'] as const) {
  storage.watch(key, () => void refresh());
}
