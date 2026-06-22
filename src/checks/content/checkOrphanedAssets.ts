import type { AssetProps, EntryProps } from 'contentful-management';
import { Finding } from '../types';

export function checkOrphanedAssets(entries: EntryProps[], assets: AssetProps[]): Finding[] {
  const referencedAssetIds = new Set<string>();

  for (const entry of entries) {
    for (const localeMap of Object.values(entry.fields)) {
      for (const value of Object.values(localeMap as Record<string, unknown>)) {
        const candidates = Array.isArray(value) ? value : [value];
        for (const item of candidates) {
          if (typeof item !== 'object' || item === null) continue;
          const sys = (item as Record<string, unknown>).sys as Record<string, unknown> | undefined;
          if (sys?.type === 'Link' && sys?.linkType === 'Asset') {
            referencedAssetIds.add(sys.id as string);
          }
        }
      }
    }
  }

  return assets
    .filter((asset) => !referencedAssetIds.has(asset.sys.id))
    .map((asset) => ({
      id: `orphan-asset-${asset.sys.id}`,
      severity: 'warning' as const,
      category: 'Orphaned Media',
      message: `Asset "${asset.fields?.title?.['en-US'] ?? asset.sys.id}" is not referenced by any entry`,
      target: { type: 'asset' as const, id: asset.sys.id },
    }));
}
