import type { ContentTypeProps } from 'contentful-management';
import { Finding } from '../types';

export function checkMissingValidations(contentTypes: ContentTypeProps[]): Finding[] {
  const findings: Finding[] = [];

  for (const ct of contentTypes) {
    const ctId = ct.sys.id;
    const ctName = ct.name;
    const target = { type: 'contentType' as const, id: ctId };

    for (const field of ct.fields) {
      if (field.type === 'Link' && field.linkType === 'Entry') {
        const hasAllowedTypes = field.validations?.some((v) => 'linkContentType' in v);
        if (!hasAllowedTypes) {
          findings.push({
            id: `validation-link-${ctId}-${field.id}`,
            severity: 'warning',
            message: `Entry link field "${field.name}" (${field.id}) in "${ctName}" has no allowed content types constraint`,
            target,
          });
        }
      }

      if (
        field.type === 'Array' &&
        field.items?.type === 'Link' &&
        field.items?.linkType === 'Entry'
      ) {
        const hasAllowedTypes = field.items?.validations?.some((v) => 'linkContentType' in v);
        if (!hasAllowedTypes) {
          findings.push({
            id: `validation-array-link-${ctId}-${field.id}`,
            severity: 'warning',
            message: `Reference array field "${field.name}" (${field.id}) in "${ctName}" has no allowed content types constraint`,
            target,
          });
        }
      }

      if (field.type === 'RichText') {
        const hasSizeLimit = field.validations?.some((v) => 'size' in v);
        if (!hasSizeLimit) {
          findings.push({
            id: `validation-richtext-${ctId}-${field.id}`,
            severity: 'info',
            message: `RichText field "${field.name}" (${field.id}) in "${ctName}" has no size limit validation`,
            target,
          });
        }
      }
    }
  }

  return findings;
}
