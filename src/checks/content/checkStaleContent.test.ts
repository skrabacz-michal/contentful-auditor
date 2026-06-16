import type { EntryProps } from 'contentful-management';
import { describe, expect, it } from 'vitest';
import { checkStaleContent } from './checkStaleContent';
import { STALE_CONTENT_DAYS } from '../rules.config';

function makeEntry(id: string, updatedAt: string): EntryProps {
  return {
    sys: {
      id,
      updatedAt,
      contentType: { sys: { type: 'Link', linkType: 'ContentType', id: 'testType' } },
    } as any,
    fields: {},
  } as unknown as EntryProps;
}

const now = new Date('2026-06-16T00:00:00.000Z');

function daysAgo(days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe('checkStaleContent', () => {
  it('returns no findings for a recently updated entry', () => {
    const entries = [makeEntry('e1', daysAgo(30))];
    expect(checkStaleContent(entries, now)).toHaveLength(0);
  });

  it('returns no findings for an entry updated exactly at the threshold', () => {
    const entries = [makeEntry('e1', daysAgo(STALE_CONTENT_DAYS))];
    expect(checkStaleContent(entries, now)).toHaveLength(0);
  });

  it('flags an entry updated one day past the threshold as warning', () => {
    const entries = [makeEntry('e1', daysAgo(STALE_CONTENT_DAYS + 1))];
    const findings = checkStaleContent(entries, now);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
    expect(findings[0].id).toBe('stale-e1');
    expect(findings[0].message).toContain(`${STALE_CONTENT_DAYS} days`);
    expect(findings[0].target).toEqual({ type: 'entry', id: 'e1' });
  });

  it('flags multiple stale entries', () => {
    const entries = [
      makeEntry('e1', daysAgo(400)),
      makeEntry('e2', daysAgo(10)),
      makeEntry('e3', daysAgo(500)),
    ];
    const findings = checkStaleContent(entries, now);
    expect(findings).toHaveLength(2);
    expect(findings.map((f) => f.id)).toEqual(['stale-e1', 'stale-e3']);
  });

  it('includes the last-updated date in the message', () => {
    const updatedAt = daysAgo(400);
    const entries = [makeEntry('e1', updatedAt)];
    const [finding] = checkStaleContent(entries, now);
    expect(finding.message).toContain(updatedAt.slice(0, 10));
  });
});
