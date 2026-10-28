import { SCHEMA_VERSION, type StorageSchema } from './types';
import { uid } from '@/utils/id';

/** Names of the example page and groups (translated by the caller). */
export interface DefaultLabels {
  page: string;
  groupUseful: string;
  groupNews: string;
}

const ENGLISH: DefaultLabels = { page: 'Home', groupUseful: 'Useful', groupNews: 'News' };

/** First-run data: one page, three columns, a few example bookmarks. */
export function createDefaultData(labels: DefaultLabels = ENGLISH): StorageSchema {
  const now = Date.now();
  const col1 = uid();
  const col2 = uid();
  const col3 = uid();
  const pageId = uid();

  const mk = (title: string, url: string) => ({ id: uid(), title, url, createdAt: now });

  return {
    schemaVersion: SCHEMA_VERSION,
    settings: {
      theme: 'auto',
      background: { type: 'solid', value: '' },
      showGreeting: true,
      userName: '',
      greetingByTime: true,
      columnsCount: 3,
      language: 'auto',
      showWebSearch: true,
      searchEngine: 'brave',
      cardOpacity: 1,
      siteIcons: false,
    },
    activePageId: pageId,
    notes: [],
    todos: [],
    pages: [
      {
        id: pageId,
        title: labels.page,
        groups: [
          {
            id: uid(),
            title: labels.groupUseful,
            bookmarks: [
              mk('GitHub', 'https://github.com/'),
              mk('Wikipedia', 'https://www.wikipedia.org/'),
              mk('MDN Web Docs', 'https://developer.mozilla.org/'),
            ],
          },
          {
            id: uid(),
            title: labels.groupNews,
            bookmarks: [mk('Hacker News', 'https://news.ycombinator.com/'), mk('Reddit', 'https://www.reddit.com/')],
          },
        ],
        columns: [
          { id: col1, width: { value: 1, unit: '%' } },
          { id: col2, width: { value: 1, unit: '%' } },
          { id: col3, width: { value: 1, unit: '%' } },
        ],
        widgets: [
          { id: uid(), type: 'bookmarks', columnId: col1, order: 0, props: {} },
          { id: uid(), type: 'notes', columnId: col2, order: 0, props: {} },
          { id: uid(), type: 'clock', columnId: col3, order: 0, props: {} },
          { id: uid(), type: 'todos', columnId: col3, order: 1, props: {} },
        ],
      },
    ],
  };
}
