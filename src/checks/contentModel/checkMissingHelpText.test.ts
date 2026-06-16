import type { ContentTypeProps, EditorInterfaceProps } from 'contentful-management';
import { describe, expect, it } from 'vitest';
import { checkMissingHelpText } from './checkMissingHelpText';

function makeContentType(id: string, fields: { id: string }[]): ContentTypeProps {
  return {
    sys: { id } as any,
    name: id,
    fields: fields.map((f) => ({ id: f.id }) as any),
  } as unknown as ContentTypeProps;
}

function makeEditorInterface(contentTypeId: string, controls: { fieldId: string; helpText?: string }[]): EditorInterfaceProps {
  return {
    sys: {
      contentType: { sys: { id: contentTypeId } },
    } as any,
    controls: controls.map((c) => ({
      fieldId: c.fieldId,
      settings: c.helpText !== undefined ? { helpText: c.helpText } : undefined,
    })),
  } as unknown as EditorInterfaceProps;
}

describe('checkMissingHelpText', () => {
  it('returns no findings when all fields have help text', () => {
    const cts = [makeContentType('blog', [{ id: 'title' }])];
    const eis = [makeEditorInterface('blog', [{ fieldId: 'title', helpText: 'The article title' }])];
    expect(checkMissingHelpText(cts, eis)).toHaveLength(0);
  });

  it('flags a field with no control entry as info', () => {
    const cts = [makeContentType('blog', [{ id: 'title' }])];
    const eis = [makeEditorInterface('blog', [])];
    const findings = checkMissingHelpText(cts, eis);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('info');
    expect(findings[0].message).toContain('title');
    expect(findings[0].target).toEqual({ type: 'contentType', id: 'blog' });
  });

  it('flags a field whose control has no settings', () => {
    const cts = [makeContentType('blog', [{ id: 'title' }])];
    const eis = [makeEditorInterface('blog', [{ fieldId: 'title' }])];
    expect(checkMissingHelpText(cts, eis)).toHaveLength(1);
  });

  it('flags a field whose control has an empty helpText string', () => {
    const cts = [makeContentType('blog', [{ id: 'title' }])];
    const eis = [makeEditorInterface('blog', [{ fieldId: 'title', helpText: '   ' }])];
    expect(checkMissingHelpText(cts, eis)).toHaveLength(1);
  });

  it('flags when there is no editor interface for the content type', () => {
    const cts = [makeContentType('blog', [{ id: 'title' }, { id: 'slug' }])];
    const findings = checkMissingHelpText(cts, []);
    expect(findings).toHaveLength(2);
  });

  it('reports one finding per missing field', () => {
    const cts = [makeContentType('blog', [{ id: 'title' }, { id: 'slug' }, { id: 'body' }])];
    const eis = [makeEditorInterface('blog', [{ fieldId: 'title', helpText: 'ok' }])];
    expect(checkMissingHelpText(cts, eis)).toHaveLength(2);
  });

  it('handles multiple content types independently', () => {
    const cts = [
      makeContentType('blog', [{ id: 'title' }]),
      makeContentType('page', [{ id: 'heading' }]),
    ];
    const eis = [
      makeEditorInterface('blog', [{ fieldId: 'title', helpText: 'ok' }]),
      makeEditorInterface('page', []),
    ];
    const findings = checkMissingHelpText(cts, eis);
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toContain('heading');
  });
});
