import { el } from '@/components/dom';
import { confirmDialog, openContentDialog, openFormDialog } from '@/components/dialog';
import { renderMarkdown } from '@/components/markdown-view';
import { widgetFrame } from '@/components/widget-frame';
import { updateNotes } from '@/lib/list-store';
import { addNote, deleteNote, deriveTitle, notePreview, sortNotes, togglePin, updateNote } from '@/lib/notes-ops';
import type { Note, WidgetConfig } from '@/lib/types';
import { uid } from '@/utils/id';

function smallButton(text: string, label: string, onClick: () => void): HTMLButtonElement {
  const button = el('button', { class: 'btn small', text, attrs: { type: 'button', title: label, 'aria-label': label } });
  button.addEventListener('click', onClick);
  return button;
}

/** Asks for a title and Markdown content. Resolves with the values to save, or null if cancelled. */
async function askNote(heading: string, submitLabel: string, initial?: Note): Promise<Pick<Note, 'title' | 'content'> | null> {
  const values = await openFormDialog({
    title: heading,
    submitLabel,
    fields: [
      { name: 'title', label: 'Title', value: initial?.title ?? '', placeholder: 'Optional (defaults to the first line)' },
      {
        name: 'content',
        label: 'Text (Markdown supported)',
        value: initial?.content ?? '',
        multiline: true,
        rows: 10,
        placeholder: '# Heading\n- list item\n**bold**, *italic*, `code`, [link](https://example.com)',
      },
    ],
    validate: (v) => (!v.title && !v.content ? 'Write a title or some text' : null),
  });
  if (!values) return null;
  const content = values.content ?? '';
  return { title: values.title || deriveTitle(content), content };
}

/** Notes widget: list of notes, view (rendered Markdown), edit, pin, delete. */
export function renderNotesWidget(widget: WidgetConfig, notes: Note[]): HTMLElement {
  const addButton = smallButton('+ Note', 'Add a note', () => void onAdd());
  const { root, body } = widgetFrame(widget, 'Notes', [addButton]);

  async function onAdd(): Promise<void> {
    const data = await askNote('New note', 'Save');
    if (!data) return;
    const now = Date.now();
    const note: Note = { id: uid(), pinned: false, createdAt: now, updatedAt: now, ...data };
    await updateNotes((list) => addNote(list, note));
  }

  async function onEdit(note: Note): Promise<void> {
    const data = await askNote('Edit note', 'Save', note);
    if (!data) return;
    await updateNotes((list) => updateNote(list, note.id, data, Date.now()));
  }

  async function onOpen(note: Note): Promise<void> {
    const action = await openContentDialog({
      title: note.title,
      content: renderMarkdown(note.content),
      actions: [{ label: 'Edit', value: 'edit', variant: 'primary' }],
    });
    if (action === 'edit') await onEdit(note);
  }

  async function onDelete(note: Note): Promise<void> {
    const ok = await confirmDialog({
      title: 'Delete note?',
      message: `“${note.title}” will be deleted.`,
      confirmLabel: 'Delete',
    });
    if (ok) await updateNotes((list) => deleteNote(list, note.id));
  }

  if (notes.length === 0) {
    body.append(el('p', { class: 'muted', text: 'No notes yet. Click “+ Note”.' }));
    return root;
  }

  const list = el('ul', { class: 'notes' });
  for (const note of sortNotes(notes)) {
    const main = el('button', { class: 'note-main', attrs: { type: 'button' } }, [
      el('span', { class: 'note-title', text: note.title }),
      el('span', { class: 'note-preview', text: notePreview(note) }),
    ]);
    main.addEventListener('click', () => void onOpen(note));

    const pin = smallButton(note.pinned ? '★' : '☆', note.pinned ? 'Unpin note' : 'Pin note', () => {
      void updateNotes((l) => togglePin(l, note.id));
    });
    if (note.pinned) pin.classList.add('on');

    list.append(
      el('li', { class: 'note-row' }, [
        main,
        el('span', { class: 'row-actions always' }, [pin, smallButton('✕', 'Delete note', () => void onDelete(note))]),
      ]),
    );
  }
  body.append(list);
  return root;
}
