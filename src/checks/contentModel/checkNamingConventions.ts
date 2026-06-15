import type { ContentTypeProps } from 'contentful-management';
import { Finding } from '../types';
import { isCamelCaseId, isContentTypeIdValid, startsWithUppercase } from '../utils';

export function checkNamingConventions(contentTypes: ContentTypeProps[]): Finding[] {
  const findings: Finding[] = [];

  for (const ct of contentTypes) {
    const ctId = ct.sys.id;
    const ctName = ct.name;
    const target = { type: 'contentType' as const, id: ctId };

    if (!isContentTypeIdValid(ctId)) {
      findings.push({
        id: `naming-ct-id-${ctId}`,
        severity: 'warning',
        message: `Content type ID "${ctId}" is not camelCase`,
        target,
      });
    }

    if (!startsWithUppercase(ctName)) {
      findings.push({
        id: `naming-ct-name-${ctId}`,
        severity: 'info',
        message: `Content type name "${ctName}" (${ctId}) should start with an uppercase letter`,
        target,
      });
    }

    for (const field of ct.fields) {
      if (!isCamelCaseId(field.id)) {
        findings.push({
          id: `naming-field-id-${ctId}-${field.id}`,
          severity: 'warning',
          message: `Field ID "${field.id}" in "${ctName}" is not camelCase`,
          target,
        });
      }

      if (!startsWithUppercase(field.name)) {
        findings.push({
          id: `naming-field-name-${ctId}-${field.id}`,
          severity: 'info',
          message: `Field name "${field.name}" (${field.id}) in "${ctName}" should start with an uppercase letter`,
          target,
        });
      }
    }
  }

  return findings;
}
