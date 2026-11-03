import { el } from '@/components/dom';
import { groupIconElement } from '@/components/group-icon';
import { EMOJI_CHOICES, isSingleEmoji, MAX_GROUP_ICON_CHARS } from '@/lib/group-icon';
import { t } from '@/lib/i18n';
import type { GroupIcon } from '@/lib/types';
import { pickFile } from '@/utils/download';
import { imageFileToIcon } from '@/utils/image';

export interface GroupDialogOptions {
  title: string;
  submitLabel: string;
  name: string;
  icon: GroupIcon | null;
}

export interface GroupDialogResult {
  title: string;
  icon: GroupIcon | null;
}

/** Name and icon of a group: pick an emoji, type any emoji, or use a picture from the computer. */
export function openGroupDialog(options: GroupDialogOptions): Promise<GroupDialogResult | null> {
  return new Promise((resolve) => {
    const dialog = el('dialog', { class: 'dialog' });
    const form = el('form', { class: 'dialog-form' });
    let icon: GroupIcon | null = options.icon;

    const nameInput = el('input', { attrs: { type: 'text', autocomplete: 'off', name: 'title' } });
    nameInput.value = options.name;

    const preview = el('span', { class: 'group-icon-preview' });
    const showIcon = (): void => {
      preview.replaceChildren(icon ? groupIconElement(icon) : el('span', { class: 'muted', text: t('group.noIcon') }));
    };
    showIcon();

    const error = el('p', { class: 'dialog-error' });
    error.hidden = true;
    const fail = (key: string | null): void => {
      error.hidden = key === null;
      if (key) error.textContent = t(key);
    };

    const emojiInput = el('input', { class: 'emoji-input', attrs: { type: 'text', autocomplete: 'off', placeholder: t('group.emojiType'), maxlength: '24' } });
    emojiInput.addEventListener('input', () => {
      const value = emojiInput.value.trim();
      if (!value) return fail(null);
      if (isSingleEmoji(value)) {
        icon = { type: 'emoji', value };
        showIcon();
        fail(null);
      } else {
        fail('group.emojiBad');
      }
    });

    const grid = el('div', { class: 'emoji-grid' });
    for (const emoji of EMOJI_CHOICES) {
      const button = el('button', { class: 'emoji-choice', text: emoji, attrs: { type: 'button', 'aria-label': emoji } });
      button.addEventListener('click', () => {
        icon = { type: 'emoji', value: emoji };
        emojiInput.value = '';
        showIcon();
        fail(null);
      });
      grid.append(button);
    }

    const upload = el('button', { class: 'btn small', text: t('group.upload'), attrs: { type: 'button' } });
    upload.addEventListener('click', () => {
      void (async () => {
        const file = await pickFile('image/png,image/jpeg,image/webp');
        if (!file) return;
        const dataUrl = await imageFileToIcon(file, MAX_GROUP_ICON_CHARS);
        if (!dataUrl) return fail('group.imageBad');
        icon = { type: 'image', value: dataUrl };
        emojiInput.value = '';
        showIcon();
        fail(null);
      })();
    });
    const remove = el('button', { class: 'btn small', text: t('group.removeIcon'), attrs: { type: 'button' } });
    remove.addEventListener('click', () => {
      icon = null;
      emojiInput.value = '';
      showIcon();
      fail(null);
    });

    const cancel = el('button', { class: 'btn', text: t('common.cancel'), attrs: { type: 'button' } });
    const submit = el('button', { class: 'btn primary', text: options.submitLabel, attrs: { type: 'submit' } });
    form.append(
      el('h3', { class: 'dialog-title', text: options.title }),
      el('label', { class: 'dialog-field' }, [el('span', { text: t('bm.groupName') }), nameInput]),
      el('div', { class: 'dialog-field' }, [
        el('span', { text: t('group.icon') }),
        el('div', { class: 'group-icon-row' }, [preview, upload, remove]),
        grid,
        emojiInput,
      ]),
      error,
      el('div', { class: 'dialog-buttons' }, [cancel, submit]),
    );
    dialog.append(form);

    let result: GroupDialogResult | null = null;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const title = nameInput.value.trim();
      if (!title) return fail('group.nameRequired');
      result = { title, icon };
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
