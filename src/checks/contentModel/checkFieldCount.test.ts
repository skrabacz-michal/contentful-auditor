import type { ContentTypeProps } from 'contentful-management';
import { describe, expect, it } from 'vitest';
import { MAX_FIELDS_PER_CONTENT_TYPE } from '../rules.config';
import { checkFieldCount } from './checkFieldCount';

function makeCT(fieldCount: number): ContentTypeProps {
  const fields = Array.from({ length: fieldCount }, (_, i) => ({
    id: `field${i}`,
    name: `Field ${i}`,
    type: 'Symbol',
    required: false,
    localized: false,
    validations: [],
  })) as any[];
  return { sys: { id: 'test' } as any, name: 'Test', description: '', displayField: 'field0', fields } as unknown as ContentTypeProps;
}

describe('checkFieldCount', () => {
  it('passes for content type at the threshold', () => {
    expect(checkFieldCount([makeCT(MAX_FIELDS_PER_CONTENT_TYPE)])).toHaveLength(0);
  });

  it('passes for content type below the threshold', () => {
    expect(checkFieldCount([makeCT(MAX_FIELDS_PER_CONTENT_TYPE - 1)])).toHaveLength(0);
  });

  it('flags content type exceeding threshold as warning', () => {
    const findings = checkFieldCount([makeCT(MAX_FIELDS_PER_CONTENT_TYPE + 1)]);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
    expect(findings[0].message).toContain(String(MAX_FIELDS_PER_CONTENT_TYPE + 1));
    expect(findings[0].message).toContain(String(MAX_FIELDS_PER_CONTENT_TYPE));
  });

  it('sets navigation target to the content type', () => {
    const findings = checkFieldCount([makeCT(MAX_FIELDS_PER_CONTENT_TYPE + 1)]);
    expect(findings[0].target).toEqual({ type: 'contentType', id: 'test' });
  });

  it('only flags content types that exceed the threshold', () => {
    const cts = [makeCT(10), makeCT(MAX_FIELDS_PER_CONTENT_TYPE + 5), makeCT(MAX_FIELDS_PER_CONTENT_TYPE)];
    expect(checkFieldCount(cts)).toHaveLength(1);
  });
});
