import type { AssetProps, EntryProps } from 'contentful-management';
import { Finding } from '../types';
import { checkBrokenReferences } from './checkBrokenReferences';
import { checkOrphanedEntries } from './checkOrphanedEntries';

export function runContentChecks(entries: EntryProps[], assets: AssetProps[]): Finding[] {
  return [...checkBrokenReferences(entries, assets), ...checkOrphanedEntries(entries)];
}
