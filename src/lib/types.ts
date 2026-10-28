// FluxHome data types. They describe the storage schema.

export const SCHEMA_VERSION = 2;

export type ThemeMode = 'light' | 'dark' | 'auto';
export type BackgroundType = 'solid' | 'image' | 'gradient';
export type Priority = 'low' | 'medium' | 'high';
export type WidgetType = 'bookmarks' | 'notes' | 'todos' | 'clock';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string; // base64 data URL; '' means "tried, none found"
  tags?: string[];
  createdAt: number;
}

export interface BookmarkGroup {
  id: string;
  title: string;
  bookmarks: Bookmark[];
}

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown or HTML
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  deadline?: number; // timestamp
  hasTime?: boolean; // true when the deadline includes a time of day (otherwise it is a whole day)
  priority: Priority;
}

export interface ColumnConfig {
  id: string;
  // '%' is a proportional share of the width, 'px' is a fixed width
  width: { value: number; unit: '%' | 'px' };
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  columnId: string; // column the widget lives in
  order: number; // position inside the column
  height?: number; // px, optional
  props: Record<string, unknown>; // widget-specific properties
}

export interface Page {
  id: string;
  title: string;
  groups: BookmarkGroup[];
  columns: ColumnConfig[];
  widgets: WidgetConfig[];
}

export interface Background {
  type: BackgroundType;
  value: string;
}

export interface Settings {
  theme: ThemeMode;
  background: Background;
  showGreeting: boolean;
  userName: string;
  greetingByTime: boolean;
  columnsCount: number;
  /** "auto" (browser language) or a locale code such as "en" or "ru". */
  language: string;
  /** Show the web search bar in the header. */
  showWebSearch: boolean;
  /** Id of the search engine used by the web search bar (see lib/search-engines.ts). */
  searchEngine: string;
  /** Opacity of cards and header controls: 1 = solid, 0 = fully transparent. */
  cardOpacity: number;
  /** Download and show the icons of bookmarked sites (needs the optional host permission). */
  siteIcons: boolean;
}

// Contents of browser.storage.local (key -> value type)
export interface StorageSchema {
  schemaVersion: number;
  settings: Settings;
  pages: Page[];
  activePageId: string;
  notes: Note[];
  todos: Todo[];
}

export type StorageKey = keyof StorageSchema;
