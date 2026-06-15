import type { ContentTypeProps } from 'contentful-management';
import { Finding } from '../types';
import { MAX_FIELDS_PER_CONTENT_TYPE } from '../rules.config';

export function checkFieldCount(contentTypes: ContentTypeProps[]): Finding[] {
  return contentTypes
    .filter((ct) => ct.fields.length > MAX_FIELDS_PER_CONTENT_TYPE)
    .map((ct) => ({
      id: `field-count-${ct.sys.id}`,
      severity: 'warning' as const,
      message: `Content type "${ct.name}" has ${ct.fields.length} fields (max recommended: ${MAX_FIELDS_PER_CONTENT_TYPE})`,
      target: { type: 'contentType' as const, id: ct.sys.id },
    }));
}
