export type DarkModeStrategy =
  | { type: 'class'; className?: string }
  | { type: 'data'; attribute?: string }
  | { type: 'media' }
  | { type: 'media-or-class'; className?: string }
  | false;

export type ModePreference = 'light' | 'dark' | 'system';
export type ResolvedMode = 'light' | 'dark';
