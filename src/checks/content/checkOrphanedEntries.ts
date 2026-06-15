import type { EntryProps } from 'contentful-management';
import { Finding } from '../types';

function isEntryLink(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const sys = (value as Record<string, unknown>).sys as Record<string, unknown> | undefined;
  return sys?.type === 'Link' && sys?.linkType === 'Entry';
}

function getEntryLinkId(value: unknown): string {
  return ((value as Record<string, unknown>).sys as Record<string, unknown>).id as string;
}

export function checkOrphanedEntries(entries: EntryProps[]): Finding[] {
  const referencedIds = new Set<string>();

  for (const entry of entries) {
    for (const localeMap of Object.values(entry.fields)) {
      for (const value of Object.values(localeMap as Record<string, unknown>)) {
        const candidates = Array.isArray(value) ? value : [value];
        for (const item of candidates) {
          if (isEntryLink(item)) {
            referencedIds.add(getEntryLinkId(item));
          }
        }
      }
    }
  }

  return entries
    .filter((entry) => !referencedIds.has(entry.sys.id))
    .map((entry) => ({
      id: `orphan-${entry.sys.id}`,
      severity: 'warning' as const,
      message: `Entry "${entry.sys.id}" (${entry.sys.contentType.sys.id}) is not referenced by any other entry`,
      target: { type: 'entry' as const, id: entry.sys.id },
    }));
}
