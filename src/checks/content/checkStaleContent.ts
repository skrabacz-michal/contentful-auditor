import type { EntryProps } from 'contentful-management';
import { Finding } from '../types';
import { STALE_CONTENT_DAYS } from '../rules.config';

export function checkStaleContent(entries: EntryProps[], now = new Date()): Finding[] {
  const thresholdMs = STALE_CONTENT_DAYS * 24 * 60 * 60 * 1000;
  const findings: Finding[] = [];

  for (const entry of entries) {
    const updatedAt = new Date(entry.sys.updatedAt);
    if (now.getTime() - updatedAt.getTime() > thresholdMs) {
      findings.push({
        id: `stale-${entry.sys.id}`,
        severity: 'warning',
        category: 'Stale Content',
        message: `Entry has not been updated in over ${STALE_CONTENT_DAYS} days (last updated: ${updatedAt.toISOString().slice(0, 10)})`,
        target: { type: 'entry', id: entry.sys.id },
      });
    }
  }

  return findings;
}
