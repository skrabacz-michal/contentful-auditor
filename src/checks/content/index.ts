import type { AssetProps, ContentTypeProps, EntryProps } from 'contentful-management';
import { EXCLUDED_CONTENT_TYPE_IDS } from '../rules.config';
import { Finding } from '../types';
import { checkBrokenReferences } from './checkBrokenReferences';
import { checkOrphanedEntries } from './checkOrphanedEntries';
import { checkUnpublishedReferences } from './checkUnpublishedReferences';
import { checkStaleContent } from './checkStaleContent';
import { checkEmptyRequiredFields } from './checkEmptyRequiredFields';

export function runContentChecks(
  entries: EntryProps[],
  assets: AssetProps[],
  contentTypes: ContentTypeProps[]
): Finding[] {
  const filtered = entries.filter(
    (e) => !EXCLUDED_CONTENT_TYPE_IDS.has(e.sys.contentType.sys.id)
  );
  return [
    ...checkBrokenReferences(filtered, assets),
    ...checkOrphanedEntries(filtered),
    ...checkUnpublishedReferences(filtered, assets),
    ...checkStaleContent(filtered),
    ...checkEmptyRequiredFields(filtered, contentTypes),
  ];
}
