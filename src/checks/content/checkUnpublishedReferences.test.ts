import type { AssetProps, EntryProps } from 'contentful-management';
import { describe, expect, it } from 'vitest';
import { checkUnpublishedReferences } from './checkUnpublishedReferences';

function makeEntry(
  id: string,
  fields: Record<string, Record<string, unknown>> = {},
  publishedVersion?: number
): EntryProps {
  return {
    sys: {
      id,
      publishedVersion,
      contentType: { sys: { type: 'Link', linkType: 'ContentType', id: 'testType' } },
    } as any,
    fields,
  } as unknown as EntryProps;
}

function makeAsset(id: string, publishedVersion?: number): AssetProps {
  return { sys: { id, publishedVersion } as any } as unknown as AssetProps;
}

function entryLink(id: string) {
  return { sys: { type: 'Link', linkType: 'Entry', id } };
}

function assetLink(id: string) {
  return { sys: { type: 'Link', linkType: 'Asset', id } };
}

describe('checkUnpublishedReferences', () => {
  it('returns no findings when entries have no links', () => {
    expect(checkUnpublishedReferences([makeEntry('e1')], [])).toHaveLength(0);
  });

  it('passes when entry links to a published entry', () => {
    const entries = [
      makeEntry('e1', { ref: { 'en-US': entryLink('e2') } }),
      makeEntry('e2', {}, 1),
    ];
    expect(checkUnpublishedReferences(entries, [])).toHaveLength(0);
  });

  it('flags link to an unpublished entry as warning', () => {
    const entries = [
      makeEntry('e1', { ref: { 'en-US': entryLink('e2') } }, 1),
      makeEntry('e2'),
    ];
    const findings = checkUnpublishedReferences(entries, []);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
    expect(findings[0].message).toContain('e2');
    expect(findings[0].message).toContain('ref');
    expect(findings[0].target).toEqual({ type: 'entry', id: 'e1' });
  });

  it('passes when entry links to a published asset', () => {
    const entries = [makeEntry('e1', { img: { 'en-US': assetLink('a1') } })];
    const assets = [makeAsset('a1', 1)];
    expect(checkUnpublishedReferences(entries, assets)).toHaveLength(0);
  });

  it('flags link to an unpublished asset as warning', () => {
    const entries = [makeEntry('e1', { img: { 'en-US': assetLink('a1') } })];
    const assets = [makeAsset('a1')];
    const findings = checkUnpublishedReferences(entries, assets);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
    expect(findings[0].message).toContain('asset');
  });

  it('deduplicates the same unpublished link across locales', () => {
    const entries = [
      makeEntry('e1', {
        ref: { 'en-US': entryLink('e2'), 'de-DE': entryLink('e2') },
      }),
      makeEntry('e2'),
    ];
    expect(checkUnpublishedReferences(entries, [])).toHaveLength(1);
  });

  it('does not flag missing entries (those are handled by checkBrokenReferences)', () => {
    const entries = [makeEntry('e1', { ref: { 'en-US': entryLink('missing') } })];
    expect(checkUnpublishedReferences(entries, [])).toHaveLength(0);
  });
});
