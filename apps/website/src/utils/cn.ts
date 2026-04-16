import { cx } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

export function cn(...args: Parameters<typeof cx>) {
  return twMerge(cx(...args));
}
