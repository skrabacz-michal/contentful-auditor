import type { ContentTypeProps } from 'contentful-management';
import { describe, expect, it } from 'vitest';
import { checkMissingValidations } from './checkMissingValidations';

function makeCT(fields: ContentTypeProps['fields']): ContentTypeProps {
  return { sys: { id: 'test' } as any, name: 'Test', description: '', displayField: 'title', fields } as unknown as ContentTypeProps;
}

function linkField(linkType: 'Entry' | 'Asset', validations: any[] = []): ContentTypeProps['fields'][number] {
  return { id: 'ref', name: 'Ref', type: 'Link', linkType, required: false, localized: false, validations } as any;
}

function arrayLinkField(validations: any[] = []): ContentTypeProps['fields'][number] {
  return {
    id: 'refs',
    name: 'Refs',
    type: 'Array',
    required: false,
    localized: false,
    validations: [],
    items: { type: 'Link', linkType: 'Entry', validations },
  } as any;
}

function richTextField(validations: any[] = []): ContentTypeProps['fields'][number] {
  return { id: 'body', name: 'Body', type: 'RichText', required: false, localized: false, validations } as any;
}

function symbolField(): ContentTypeProps['fields'][number] {
  return { id: 'title', name: 'Title', type: 'Symbol', required: false, localized: false, validations: [] } as any;
}

describe('checkMissingValidations', () => {
  describe('Link to Entry', () => {
    it('flags missing allowed content types as warning', () => {
      const findings = checkMissingValidations([makeCT([linkField('Entry', [])])]);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe('warning');
      expect(findings[0].id).toContain('validation-link');
    });

    it('passes when allowed content types are set', () => {
      const findings = checkMissingValidations([makeCT([linkField('Entry', [{ linkContentType: ['page'] }])])]);
      expect(findings).toHaveLength(0);
    });

    it('does not flag Link to Asset for missing content type constraint', () => {
      expect(checkMissingValidations([makeCT([linkField('Asset', [])])])).toHaveLength(0);
    });
  });

  describe('Array of Entry links', () => {
    it('flags missing allowed content types as warning', () => {
      const findings = checkMissingValidations([makeCT([arrayLinkField([])])]);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe('warning');
      expect(findings[0].id).toContain('validation-array-link');
    });

    it('passes when allowed content types are set on items', () => {
      const findings = checkMissingValidations([makeCT([arrayLinkField([{ linkContentType: ['page'] }])])]);
      expect(findings).toHaveLength(0);
    });
  });

  describe('RichText', () => {
    it('flags missing size limit as info', () => {
      const findings = checkMissingValidations([makeCT([richTextField([])])]);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe('info');
      expect(findings[0].id).toContain('validation-richtext');
    });

    it('passes when size validation is set', () => {
      const findings = checkMissingValidations([makeCT([richTextField([{ size: { max: 50000 } }])])]);
      expect(findings).toHaveLength(0);
    });
  });

  it('does not flag Symbol fields', () => {
    expect(checkMissingValidations([makeCT([symbolField()])])).toHaveLength(0);
  });

  it('sets navigation target to the content type', () => {
    const findings = checkMissingValidations([makeCT([linkField('Entry')])]);
    expect(findings[0].target).toEqual({ type: 'contentType', id: 'test' });
  });
});
