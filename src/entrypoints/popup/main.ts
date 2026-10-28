import '@/assets/theme.css';
import './style.css';
import { browser } from 'wxt/browser';
import { el } from '@/components/dom';
import { loadConfig } from '@/lib/config';
import { locale, setLanguage, t } from '@/lib/i18n';
import { addBookmark, addGroup, findBookmarkByUrl } from '@/lib/page-ops';
import { updatePage } from '@/lib/page-store';
import { uid } from '@/utils/id';
import { hostnameOf, normalizeUrl } from '@/utils/url';

const NEW_GROUP = '__new__';

function field(label: string, control: HTMLElement): HTMLElement {
  return el('label', { class: 'field' }, [el('span', { text: label }), control]);
}

async function init(): Promise<void> {
  const app = document.getElementById('app')!;
  const root = el('div', { class: 'popup' });
  app.append(root);

  const config = await loadConfig();
  setLanguage(config.settings.language);
  document.documentElement.lang = locale();
  document.documentElement.dataset.theme = config.settings.theme;
  const page = config.pages.find((p) => p.id === config.activePageId) ?? config.pages[0]!;

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  // Only real web pages can be saved (not chrome://, about:, file:, ...)
  const url = tab?.url && /^https?:\/\//i.test(tab.url) ? normalizeUrl(tab.url) : null;
  if (!url) {
    root.append(
      el('h1', { text: t('pu.title') }),
      el('p', { class: 'muted', text: t('pu.cannot') }),
    );
    return;
  }

  // ---- form ----
  const titleInput = el('input', { attrs: { type: 'text', autocomplete: 'off' } });
  titleInput.value = (tab?.title ?? '').trim() || hostnameOf(url);

  const groupSelect = el('select');
  for (const group of page.groups) {
    groupSelect.append(el('option', { text: group.title, attrs: { value: group.id } }));
  }
  groupSelect.append(el('option', { text: t('pu.newGroup'), attrs: { value: NEW_GROUP } }));
  if (page.groups.length === 0) groupSelect.value = NEW_GROUP;

  const newGroupInput = el('input', { attrs: { type: 'text', autocomplete: 'off', placeholder: t('pu.groupName') } });
  newGroupInput.value = t('default.saved');
  const newGroupField = field(t('pu.newGroupName'), newGroupInput);
  const syncNewGroup = (): void => {
    newGroupField.hidden = groupSelect.value !== NEW_GROUP;
  };
  groupSelect.addEventListener('change', syncNewGroup);
  syncNewGroup();

  const error = el('p', { class: 'error' });
  error.hidden = true;

  const duplicate = findBookmarkByUrl(page, url);
  const save = el('button', {
    class: 'save',
    text: duplicate ? t('pu.saveAgain') : t('pu.save'),
    attrs: { type: 'submit' },
  });

  const form = el('form', { class: 'popup' }, [
    el('h1', { text: t('pu.title') }),
    el('div', { class: 'url', text: url, attrs: { title: url } }),
    field(t('pu.titleField'), titleInput),
    field(t('pu.group'), groupSelect),
    newGroupField,
  ]);
  if (duplicate) {
    form.append(el('p', { class: 'notice', text: t('pu.already', { group: duplicate.group.title }) }));
  }
  form.append(error, save);
  root.replaceWith(form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.hidden = true;
    save.disabled = true;

    const bookmark = {
      id: uid(),
      title: titleInput.value.trim() || hostnameOf(url),
      url,
      createdAt: Date.now(),
    };
    const creatingGroup = groupSelect.value === NEW_GROUP;
    const newGroupId = uid();
    const newGroupTitle = newGroupInput.value.trim() || t('default.saved');
    const targetGroupId = creatingGroup ? newGroupId : groupSelect.value;

    try {
      await updatePage(page.id, (p) => {
        const base = creatingGroup ? addGroup(p, { id: newGroupId, title: newGroupTitle, bookmarks: [] }) : p;
        return addBookmark(base, targetGroupId, bookmark);
      });
      save.textContent = t('pu.saved');
      setTimeout(() => window.close(), 700);
    } catch (err) {
      console.error(err);
      error.textContent = t('pu.error');
      error.hidden = false;
      save.disabled = false;
    }
  });

  titleInput.select();
  titleInput.focus();
}

void init();
