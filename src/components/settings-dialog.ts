import { browser } from 'wxt/browser';
import { exportBackup, importBackup } from './backup-actions';
import { el } from './dom';
import { gearIcon } from './icons';
import { createSelect } from './select';
import { createSwatchPicker } from './swatch-picker';
import { showToast } from './toast';
import { availableLocales, t } from '@/lib/i18n';
import { CARD_OPACITY_CHOICES, findPreset, MAX_COLUMNS, nearestCardOpacity, resolveBackground } from '@/lib/settings';
import { saveSettings } from '@/lib/settings-store';
import type { Page, Settings, ThemeMode, WidgetType } from '@/lib/types';

interface SettingsResult {
  settings: Settings;
  widgets: WidgetType[];
  /** Started inside the click handler (browsers only allow permission prompts there). */
  permission: Promise<boolean> | null;
}

function checkbox(label: string, checked: boolean): { element: HTMLElement; input: HTMLInputElement } {
  const input = el('input', { attrs: { type: 'checkbox' } });
  input.checked = checked;
  return { input, element: el('label', { class: 'dialog-check' }, [input, el('span', { text: label })]) };
}

const section = (title: string): HTMLElement => el('h4', { class: 'dialog-section', text: title });

const WIDGET_CHOICES: { type: WidgetType; labelKey: string }[] = [
  { type: 'bookmarks', labelKey: 'bm.title' },
  { type: 'notes', labelKey: 'note.title' },
  { type: 'todos', labelKey: 'todo.title' },
  { type: 'clock', labelKey: 'clock.title' },
];

/** Shows the settings form. Resolves with the new values, or null when cancelled. */
function askSettings(current: Settings, page: Page): Promise<SettingsResult | null> {
  return new Promise((resolve) => {
    const dialog = el('dialog', { class: 'dialog wide' });
    const form = el('form', { class: 'dialog-form' });
    const scroll = el('div', { class: 'dialog-scroll' });
    form.append(el('h3', { class: 'dialog-title', text: t('settings.title') }), scroll);

    // ---- General ----
    const nameInput = el('input', { attrs: { type: 'text', autocomplete: 'off', placeholder: t('settings.namePlaceholder') } });
    nameInput.value = current.userName;
    const showGreeting = checkbox(t('settings.showGreeting'), current.showGreeting);
    const byTime = checkbox(t('settings.greetingByTime'), current.greetingByTime);
    const syncGreeting = (): void => {
      byTime.input.disabled = !showGreeting.input.checked;
      nameInput.disabled = !showGreeting.input.checked;
    };
    showGreeting.input.addEventListener('change', syncGreeting);
    syncGreeting();

    const language = createSelect({
      ariaLabel: t('settings.language'),
      value: current.language,
      items: [{ value: 'auto', label: t('settings.langAuto') }, ...availableLocales().map((l) => ({ value: l.code, label: l.name }))],
    });
    scroll.append(
      section(t('settings.general')),
      el('label', { class: 'dialog-field' }, [el('span', { text: t('settings.language') }), language.element]),
      el('label', { class: 'dialog-field' }, [el('span', { text: t('settings.name') }), nameInput]),
      showGreeting.element,
      byTime.element,
    );

    // ---- Appearance ----
    const theme = createSelect({
      ariaLabel: t('settings.theme'),
      value: current.theme,
      items: [
        { value: 'auto', label: t('settings.themeAuto') },
        { value: 'light', label: t('settings.themeLight') },
        { value: 'dark', label: t('settings.themeDark') },
      ],
    });
    const cards = createSelect({
      ariaLabel: t('settings.cards'),
      value: String(nearestCardOpacity(current.cardOpacity)),
      items: CARD_OPACITY_CHOICES.map((c) => ({ value: String(c.value), label: t(c.labelKey) })),
    });
    const columnLabels = [t('settings.col1'), t('settings.col2'), t('settings.col3'), t('settings.col4')];
    const columns = createSelect({
      ariaLabel: t('settings.columns'),
      value: String(Math.min(MAX_COLUMNS, Math.max(1, current.columnsCount))),
      items: columnLabels.map((label, i) => ({ value: String(i + 1), label })),
    });

    const isImage = current.background.type === 'image';
    const swatches = createSwatchPicker(isImage ? null : (findPreset(current.background)?.background ?? null));
    const imageInput = el('input', { attrs: { type: 'text', autocomplete: 'off', placeholder: 'https://example.com/picture.jpg' } });
    imageInput.value = isImage ? current.background.value : '';
    swatches.onChange = () => {
      imageInput.value = '';
    };
    imageInput.addEventListener('input', () => {
      if (imageInput.value.trim()) swatches.value = null;
    });

    scroll.append(
      section(t('settings.appearance')),
      el('label', { class: 'dialog-field' }, [el('span', { text: t('settings.theme') }), theme.element]),
      el('label', { class: 'dialog-field' }, [el('span', { text: t('settings.cards') }), cards.element]),
      el('label', { class: 'dialog-field' }, [el('span', { text: t('settings.columns') }), columns.element]),
      el('div', { class: 'dialog-field' }, [el('span', { text: t('bg.title') }), swatches.element]),
      el('label', { class: 'dialog-field' }, [el('span', { text: t('settings.imageUrl') }), imageInput]),
    );

    // ---- Search, icons ----
    const webSearch = checkbox(t('settings.showWebSearch'), current.showWebSearch);
    const siteIcons = checkbox(t('settings.siteIcons'), current.siteIcons);
    scroll.append(
      section(t('settings.search')),
      webSearch.element,
      section(t('settings.icons')),
      siteIcons.element,
      el('p', { class: 'muted', text: t('settings.iconsHint') }),
    );

    // ---- Widgets ----
    const visible = new Set(page.widgets.map((w) => w.type));
    const widgetBoxes = WIDGET_CHOICES.map((choice) => ({ choice, box: checkbox(t(choice.labelKey), visible.has(choice.type)) }));
    scroll.append(
      section(t('settings.widgets')),
      el('p', { class: 'muted', text: t('settings.widgetsHint') }),
      ...widgetBoxes.map((w) => w.box.element),
    );

    // ---- Backup ----
    const exportButton = el('button', { class: 'btn', text: t('data.export'), attrs: { type: 'button', title: t('data.exportTip') } });
    const importButton = el('button', { class: 'btn', text: t('data.import'), attrs: { type: 'button', title: t('data.importTip') } });
    scroll.append(section(t('settings.data')), el('div', { class: 'dialog-row' }, [exportButton, importButton]));

    const error = el('p', { class: 'dialog-error' });
    error.hidden = true;
    const cancel = el('button', { class: 'btn', text: t('common.cancel'), attrs: { type: 'button' } });
    const save = el('button', { class: 'btn primary', text: t('common.save'), attrs: { type: 'submit' } });
    form.append(error, el('div', { class: 'dialog-buttons' }, [cancel, save]));
    dialog.append(form);

    // Export / import work on their own: close the settings first, then run them
    exportButton.addEventListener('click', () => {
      dialog.close();
      void exportBackup();
    });
    importButton.addEventListener('click', () => {
      dialog.close();
      void importBackup();
    });

    let result: SettingsResult | null = null;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const resolved = resolveBackground(swatches.value, imageInput.value);
      if ('error' in resolved) {
        error.textContent = t(resolved.error);
        error.hidden = false;
        return;
      }

      let permission: Promise<boolean> | null = null;
      if (siteIcons.input.checked && !current.siteIcons) {
        permission = browser.permissions.request({ origins: ['<all_urls>'] }).catch(() => false);
      }

      result = {
        settings: {
          ...current,
          userName: nameInput.value.trim(),
          showGreeting: showGreeting.input.checked,
          greetingByTime: byTime.input.checked,
          language: language.value,
          theme: theme.value as ThemeMode,
          cardOpacity: Number(cards.value),
          columnsCount: Number(columns.value),
          background: resolved.background,
          showWebSearch: webSearch.input.checked,
          siteIcons: siteIcons.input.checked,
        },
        widgets: widgetBoxes.filter((w) => w.box.input.checked).map((w) => w.choice.type),
        permission,
      };
      dialog.close();
    });
    cancel.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(result);
    });

    document.body.append(dialog);
    dialog.showModal();
  });
}

/** The gear button in the header that opens the settings dialog. */
export function renderSettingsButton(settings: Settings, page: Page): HTMLButtonElement {
  const button = el('button', {
    class: 'btn icon-btn',
    attrs: { type: 'button', title: t('settings.title'), 'aria-label': t('settings.title') },
  });
  button.append(gearIcon());

  button.addEventListener('click', () => {
    void (async () => {
      const result = await askSettings(settings, page);
      if (!result) return;

      let siteIcons = result.settings.siteIcons;
      if (result.permission) {
        const granted = await result.permission;
        if (!granted) {
          siteIcons = false;
          showToast(t('settings.iconsDenied'), 'error');
        }
      } else if (!siteIcons && settings.siteIcons) {
        // Icons switched off: give the permission back
        void browser.permissions.remove({ origins: ['<all_urls>'] }).catch(() => false);
      }

      await saveSettings(
        { ...result.settings, siteIcons },
        { pageId: page.id, widgets: result.widgets, resetIcons: siteIcons && !settings.siteIcons },
      );
    })();
  });
  return button;
}
