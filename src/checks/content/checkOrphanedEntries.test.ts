import type { EntryProps } from 'contentful-management';
import { describe, expect, it } from 'vitest';
import { checkOrphanedEntries } from './checkOrphanedEntries';

function makeEntry(id: string, fields: Record<string, Record<string, unknown>> = {}): EntryProps {
  return {
    sys: {
      id,
      contentType: { sys: { type: 'Link', linkType: 'ContentType', id: 'testType' } },
    } as any,
    fields,
  } as unknown as EntryProps;
}

function entryLink(id: string) {
  return { sys: { type: 'Link', linkType: 'Entry', id } };
}

function assetLink(id: string) {
  return { sys: { type: 'Link', linkType: 'Asset', id } };
}

describe('checkOrphanedEntries', () => {
  it('flags an entry with no incoming references as warning', () => {
    const findings = checkOrphanedEntries([makeEntry('e1')]);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
    expect(findings[0].target).toEqual({ type: 'entry', id: 'e1' });
  });

  it('does not flag an entry that is referenced by another', () => {
    const entries = [
      makeEntry('e1', { ref: { 'en-US': entryLink('e2') } }),
      makeEntry('e2'),
    ];
    const findings = checkOrphanedEntries(entries);
    expect(findings).toHaveLength(1);
    expect(findings[0].target?.id).toBe('e1');
  });

  it('handles references inside array fields', () => {
    const entries = [
      makeEntry('e1', { refs: { 'en-US': [entryLink('e2'), entryLink('e3')] } }),
      makeEntry('e2'),
      makeEntry('e3'),
    ];
    const findings = checkOrphanedEntries(entries);
    expect(findings).toHaveLength(1);
    expect(findings[0].target?.id).toBe('e1');
  });

  it('handles multi-locale references', () => {
    const entries = [
      makeEntry('e1', { ref: { 'en-US': entryLink('e2'), 'de-DE': entryLink('e2') } }),
      makeEntry('e2'),
    ];
    const findings = checkOrphanedEntries(entries);
    expect(findings).toHaveLength(1);
    expect(findings[0].target?.id).toBe('e1');
  });

  it('does not treat asset links as entry references', () => {
    const entries = [
      makeEntry('e1', { img: { 'en-US': assetLink('a1') } }),
    ];
    // e1 is still orphaned (asset links don't count as entry references)
    expect(checkOrphanedEntries(entries)).toHaveLength(1);
  });

  it('returns no findings when all entries are referenced', () => {
    const entries = [
      makeEntry('e1', { ref: { 'en-US': entryLink('e2') } }),
      makeEntry('e2', { ref: { 'en-US': entryLink('e1') } }),
    ];
    expect(checkOrphanedEntries(entries)).toHaveLength(0);
  });

  it('returns no findings for an empty entry list', () => {
    expect(checkOrphanedEntries([])).toHaveLength(0);
  });
});
