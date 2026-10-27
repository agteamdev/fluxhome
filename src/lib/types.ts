// FluxHome data types. They describe the storage schema.

export const SCHEMA_VERSION = 1;

export type ThemeMode = 'light' | 'dark' | 'auto';
export type BackgroundType = 'solid' | 'image' | 'gradient';
export type Priority = 'low' | 'medium' | 'high';
export type WidgetType = 'bookmarks' | 'notes' | 'todos' | 'clock' | 'search' | 'rss';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string; // base64 or URL
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

export interface Settings {
  theme: ThemeMode;
  background: { type: BackgroundType; value: string };
  showGreeting: boolean;
  userName: string;
  greetingByTime: boolean;
  columnsCount: number;
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
