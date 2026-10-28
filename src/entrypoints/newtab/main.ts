import '@/assets/theme.css';
import './style.css';
import { loadConfig } from '@/lib/config';
import { loadMissingFavicons } from '@/lib/favicon-loader';
import { locale, setLanguage, t } from '@/lib/i18n';
import { storage } from '@/lib/storage';
import { renderPage } from '@/components/page';
import { registerSearchShortcut } from '@/components/search-bar';
import { initTooltips } from '@/components/tooltip';

const app = document.getElementById('app')!;

async function refresh(): Promise<void> {
  const config = await loadConfig();
  setLanguage(config.settings.language);
  document.documentElement.lang = locale();
  document.title = t('app.newTab');
  renderPage(app, config);

  // Site icons are downloaded in the background and appear when ready
  if (config.settings.siteIcons) {
    const page = config.pages.find((p) => p.id === config.activePageId) ?? config.pages[0];
    if (page) void loadMissingFavicons(page);
  }
}

initTooltips();
registerSearchShortcut();
void refresh();

// Re-render when data changes (another tab, import, settings, etc.)
for (const key of ['settings', 'pages', 'activePageId', 'notes', 'todos'] as const) {
  storage.watch(key, () => void refresh());
}
