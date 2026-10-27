import '@/assets/theme.css';
import './style.css';
import { browser } from 'wxt/browser';
import { el } from '@/components/dom';
import { loadConfig } from '@/lib/config';
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
  document.documentElement.dataset.theme = config.settings.theme;
  const page = config.pages.find((p) => p.id === config.activePageId) ?? config.pages[0]!;

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  // Only real web pages can be saved (not chrome://, about:, file:, ...)
  const url = tab?.url && /^https?:\/\//i.test(tab.url) ? normalizeUrl(tab.url) : null;
  if (!url) {
    root.append(
      el('h1', { text: 'Save to FluxHome' }),
      el('p', { class: 'muted', text: 'This page cannot be saved. Only http and https pages are supported.' }),
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
  groupSelect.append(el('option', { text: 'New group…', attrs: { value: NEW_GROUP } }));
  if (page.groups.length === 0) groupSelect.value = NEW_GROUP;

  const newGroupInput = el('input', { attrs: { type: 'text', autocomplete: 'off', placeholder: 'Group name' } });
  newGroupInput.value = 'Saved';
  const newGroupField = field('New group name', newGroupInput);
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
    text: duplicate ? 'Save again' : 'Save this page',
    attrs: { type: 'submit' },
  });

  const form = el('form', { class: 'popup' }, [
    el('h1', { text: 'Save to FluxHome' }),
    el('div', { class: 'url', text: url, attrs: { title: url } }),
    field('Title', titleInput),
    field('Group', groupSelect),
    newGroupField,
  ]);
  if (duplicate) {
    form.append(el('p', { class: 'notice', text: `Already saved in “${duplicate.group.title}”.` }));
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
    const newGroupTitle = newGroupInput.value.trim() || 'Saved';
    const targetGroupId = creatingGroup ? newGroupId : groupSelect.value;

    try {
      await updatePage(page.id, (p) => {
        const base = creatingGroup ? addGroup(p, { id: newGroupId, title: newGroupTitle, bookmarks: [] }) : p;
        return addBookmark(base, targetGroupId, bookmark);
      });
      save.textContent = 'Saved ✓';
      setTimeout(() => window.close(), 700);
    } catch (err) {
      console.error(err);
      error.textContent = 'Could not save this page.';
      error.hidden = false;
      save.disabled = false;
    }
  });

  titleInput.select();
  titleInput.focus();
}

void init();
