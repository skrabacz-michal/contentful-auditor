import type { ContentTypeProps, EntryProps } from 'contentful-management';
import { describe, expect, it } from 'vitest';
import { checkEmptyRequiredFields } from './checkEmptyRequiredFields';

function makeContentType(id: string, fields: { id: string; required: boolean }[]): ContentTypeProps {
  return {
    sys: { id } as any,
    fields: fields.map((f) => ({ id: f.id, required: f.required }) as any),
  } as unknown as ContentTypeProps;
}

function makeEntry(
  id: string,
  contentTypeId: string,
  fields: Record<string, Record<string, unknown>> = {}
): EntryProps {
  return {
    sys: {
      id,
      contentType: { sys: { type: 'Link', linkType: 'ContentType', id: contentTypeId } },
    } as any,
    fields,
  } as unknown as EntryProps;
}

describe('checkEmptyRequiredFields', () => {
  it('returns no findings when all required fields have values', () => {
    const cts = [makeContentType('blog', [{ id: 'title', required: true }])];
    const entries = [makeEntry('e1', 'blog', { title: { 'en-US': 'Hello' } })];
    expect(checkEmptyRequiredFields(entries, cts)).toHaveLength(0);
  });

  it('flags a completely absent required field as error', () => {
    const cts = [makeContentType('blog', [{ id: 'title', required: true }])];
    const entries = [makeEntry('e1', 'blog', {})];
    const findings = checkEmptyRequiredFields(entries, cts);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('error');
    expect(findings[0].message).toContain('title');
    expect(findings[0].target).toEqual({ type: 'entry', id: 'e1' });
  });

  it('flags a required field with only null values', () => {
    const cts = [makeContentType('blog', [{ id: 'title', required: true }])];
    const entries = [makeEntry('e1', 'blog', { title: { 'en-US': null } })];
    expect(checkEmptyRequiredFields(entries, cts)).toHaveLength(1);
  });

  it('flags a required field with only empty string values', () => {
    const cts = [makeContentType('blog', [{ id: 'title', required: true }])];
    const entries = [makeEntry('e1', 'blog', { title: { 'en-US': '' } })];
    expect(checkEmptyRequiredFields(entries, cts)).toHaveLength(1);
  });

  it('flags a required field with only empty array values', () => {
    const cts = [makeContentType('blog', [{ id: 'tags', required: true }])];
    const entries = [makeEntry('e1', 'blog', { tags: { 'en-US': [] } })];
    expect(checkEmptyRequiredFields(entries, cts)).toHaveLength(1);
  });

  it('does not flag optional fields that are empty', () => {
    const cts = [makeContentType('blog', [{ id: 'subtitle', required: false }])];
    const entries = [makeEntry('e1', 'blog', {})];
    expect(checkEmptyRequiredFields(entries, cts)).toHaveLength(0);
  });

  it('does not flag a required field if at least one locale has a value', () => {
    const cts = [makeContentType('blog', [{ id: 'title', required: true }])];
    const entries = [makeEntry('e1', 'blog', { title: { 'en-US': 'Hello', 'de-DE': '' } })];
    expect(checkEmptyRequiredFields(entries, cts)).toHaveLength(0);
  });

  it('reports one finding per missing required field', () => {
    const cts = [
      makeContentType('blog', [
        { id: 'title', required: true },
        { id: 'slug', required: true },
      ]),
    ];
    const entries = [makeEntry('e1', 'blog', {})];
    expect(checkEmptyRequiredFields(entries, cts)).toHaveLength(2);
  });

  it('skips entries whose content type has no required fields', () => {
    const cts = [makeContentType('blog', [{ id: 'title', required: false }])];
    const entries = [makeEntry('e1', 'blog', {})];
    expect(checkEmptyRequiredFields(entries, cts)).toHaveLength(0);
  });

  it('does not flag a field with a numeric zero value', () => {
    const cts = [makeContentType('blog', [{ id: 'order', required: true }])];
    const entries = [makeEntry('e1', 'blog', { order: { 'en-US': 0 } })];
    expect(checkEmptyRequiredFields(entries, cts)).toHaveLength(0);
  });

  it('does not flag a field with a false boolean value', () => {
    const cts = [makeContentType('blog', [{ id: 'published', required: true }])];
    const entries = [makeEntry('e1', 'blog', { published: { 'en-US': false } })];
    expect(checkEmptyRequiredFields(entries, cts)).toHaveLength(0);
  });
});
