import type { AssetProps, EntryProps } from 'contentful-management';
import { describe, expect, it } from 'vitest';
import { checkBrokenReferences } from './checkBrokenReferences';

function makeEntry(id: string, fields: Record<string, Record<string, unknown>> = {}): EntryProps {
  return {
    sys: {
      id,
      contentType: { sys: { type: 'Link', linkType: 'ContentType', id: 'testType' } },
    } as any,
    fields,
  } as unknown as EntryProps;
}

function makeAsset(id: string): AssetProps {
  return { sys: { id } as any } as unknown as AssetProps;
}

function entryLink(id: string) {
  return { sys: { type: 'Link', linkType: 'Entry', id } };
}

function assetLink(id: string) {
  return { sys: { type: 'Link', linkType: 'Asset', id } };
}

describe('checkBrokenReferences', () => {
  it('returns no findings when entries have no links', () => {
    expect(checkBrokenReferences([makeEntry('e1')], [])).toHaveLength(0);
  });

  it('passes when entry links to an existing entry', () => {
    const entries = [
      makeEntry('e1', { ref: { 'en-US': entryLink('e2') } }),
      makeEntry('e2'),
    ];
    expect(checkBrokenReferences(entries, [])).toHaveLength(0);
  });

  it('flags link to a missing entry as error', () => {
    const entries = [makeEntry('e1', { ref: { 'en-US': entryLink('missing') } })];
    const findings = checkBrokenReferences(entries, []);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('error');
    expect(findings[0].message).toContain('missing');
    expect(findings[0].target).toEqual({ type: 'entry', id: 'e1' });
  });

  it('passes when entry links to an existing asset', () => {
    const entries = [makeEntry('e1', { img: { 'en-US': assetLink('a1') } })];
    const assets = [makeAsset('a1')];
    expect(checkBrokenReferences(entries, assets)).toHaveLength(0);
  });

  it('flags link to a missing asset as error', () => {
    const entries = [makeEntry('e1', { img: { 'en-US': assetLink('a1') } })];
    const findings = checkBrokenReferences(entries, []);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('error');
  });

  it('deduplicates the same broken link across locales', () => {
    const entries = [
      makeEntry('e1', {
        ref: { 'en-US': entryLink('missing'), 'de-DE': entryLink('missing') },
      }),
    ];
    expect(checkBrokenReferences(entries, [])).toHaveLength(1);
  });

  it('handles array of reference links with one broken', () => {
    const entries = [
      makeEntry('e1', { refs: { 'en-US': [entryLink('e2'), entryLink('missing')] } }),
      makeEntry('e2'),
    ];
    const findings = checkBrokenReferences(entries, []);
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toContain('missing');
  });

  it('reports one finding per unique broken field+target combination', () => {
    const entries = [
      makeEntry('e1', {
        ref1: { 'en-US': entryLink('x') },
        ref2: { 'en-US': entryLink('x') },
      }),
    ];
    // x is missing, but ref1 and ref2 are different fields → 2 findings
    expect(checkBrokenReferences(entries, [])).toHaveLength(2);
  });
});
