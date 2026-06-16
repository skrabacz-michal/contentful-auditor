import type { ContentTypeProps, EntryProps } from 'contentful-management';
import { Finding } from '../types';

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function checkEmptyRequiredFields(
  entries: EntryProps[],
  contentTypes: ContentTypeProps[]
): Finding[] {
  const requiredFieldsByType = new Map<string, string[]>();
  for (const ct of contentTypes) {
    const required = ct.fields.filter((f) => f.required).map((f) => f.id);
    if (required.length > 0) requiredFieldsByType.set(ct.sys.id, required);
  }

  const findings: Finding[] = [];

  for (const entry of entries) {
    const ctId = entry.sys.contentType.sys.id;
    const requiredFields = requiredFieldsByType.get(ctId);
    if (!requiredFields) continue;

    for (const fieldId of requiredFields) {
      const localeMap = entry.fields[fieldId] as Record<string, unknown> | undefined;

      if (!localeMap || Object.values(localeMap).every(isEmpty)) {
        findings.push({
          id: `empty-required-${entry.sys.id}-${fieldId}`,
          severity: 'error',
          category: 'Empty Required Fields',
          message: `Entry is missing a value for required field "${fieldId}"`,
          target: { type: 'entry', id: entry.sys.id },
        });
      }
    }
  }

  return findings;
}
