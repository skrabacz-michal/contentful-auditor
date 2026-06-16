import type { AssetProps, EntryProps } from 'contentful-management';
import { Finding } from '../types';

type LinkValue = {
  sys: { type: 'Link'; linkType: 'Entry' | 'Asset'; id: string };
};

function isLink(value: unknown): value is LinkValue {
  if (typeof value !== 'object' || value === null) return false;
  const sys = (value as Record<string, unknown>).sys as Record<string, unknown> | undefined;
  return sys?.type === 'Link' && (sys?.linkType === 'Entry' || sys?.linkType === 'Asset');
}

function extractLinks(entry: EntryProps): Array<{ fieldId: string; link: LinkValue }> {
  const links: Array<{ fieldId: string; link: LinkValue }> = [];
  const seen = new Set<string>();

  for (const [fieldId, localeMap] of Object.entries(entry.fields)) {
    for (const value of Object.values(localeMap as Record<string, unknown>)) {
      const candidates = Array.isArray(value) ? value : [value];
      for (const item of candidates) {
        if (isLink(item)) {
          const key = `${fieldId}:${item.sys.id}`;
          if (!seen.has(key)) {
            seen.add(key);
            links.push({ fieldId, link: item });
          }
        }
      }
    }
  }

  return links;
}

export function checkUnpublishedReferences(entries: EntryProps[], assets: AssetProps[]): Finding[] {
  const unpublishedEntryIds = new Set(
    entries.filter((e) => !e.sys.publishedVersion).map((e) => e.sys.id)
  );
  const unpublishedAssetIds = new Set(
    assets.filter((a) => !a.sys.publishedVersion).map((a) => a.sys.id)
  );
  const findings: Finding[] = [];

  for (const entry of entries) {
    for (const { fieldId, link } of extractLinks(entry)) {
      const isUnpublished =
        link.sys.linkType === 'Entry'
          ? unpublishedEntryIds.has(link.sys.id)
          : unpublishedAssetIds.has(link.sys.id);

      if (isUnpublished) {
        findings.push({
          id: `unpublished-ref-${entry.sys.id}-${fieldId}-${link.sys.id}`,
          severity: 'warning',
          category: 'Unpublished References',
          message: `Entry references an unpublished ${link.sys.linkType.toLowerCase()} (${link.sys.id}) via field "${fieldId}"`,
          target: { type: 'entry', id: entry.sys.id },
        });
      }
    }
  }

  return findings;
}
