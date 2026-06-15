import type { ContentTypeProps } from 'contentful-management';
import { describe, expect, it } from 'vitest';
import { checkNamingConventions } from './checkNamingConventions';

function makeCT(id: string, name: string, fields: ContentTypeProps['fields'] = []): ContentTypeProps {
  return { sys: { id } as any, name, description: '', displayField: 'title', fields } as unknown as ContentTypeProps;
}

function makeField(id: string, name: string): ContentTypeProps['fields'][number] {
  return { id, name, type: 'Symbol', required: false, localized: false, validations: [] } as any;
}

describe('checkNamingConventions', () => {
  describe('content type ID', () => {
    it('passes for valid camelCase ID', () => {
      expect(checkNamingConventions([makeCT('blogPost', 'Blog Post')])).toHaveLength(0);
    });

    it('flags PascalCase ID as warning', () => {
      const findings = checkNamingConventions([makeCT('BlogPost', 'Blog Post')]);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe('warning');
      expect(findings[0].id).toContain('naming-ct-id');
    });

    it('flags snake_case ID as warning', () => {
      const findings = checkNamingConventions([makeCT('blog_post', 'Blog Post')]);
      expect(findings[0].severity).toBe('warning');
    });

    it('flags kebab-case ID as warning', () => {
      const findings = checkNamingConventions([makeCT('blog-post', 'Blog Post')]);
      expect(findings[0].severity).toBe('warning');
    });

    it('sets navigation target to the content type', () => {
      const findings = checkNamingConventions([makeCT('BlogPost', 'Blog Post')]);
      expect(findings[0].target).toEqual({ type: 'contentType', id: 'BlogPost' });
    });
  });

  describe('content type display name', () => {
    it('passes for name starting with uppercase', () => {
      expect(checkNamingConventions([makeCT('blogPost', 'Blog Post')])).toHaveLength(0);
    });

    it('flags name starting with lowercase as info', () => {
      const findings = checkNamingConventions([makeCT('blogPost', 'blog post')]);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe('info');
      expect(findings[0].id).toContain('naming-ct-name');
    });
  });

  describe('field ID', () => {
    it('passes for valid camelCase field ID', () => {
      const ct = makeCT('blogPost', 'Blog Post', [makeField('heroImage', 'Hero Image')]);
      expect(checkNamingConventions([ct])).toHaveLength(0);
    });

    it('flags snake_case field ID as warning', () => {
      const ct = makeCT('blogPost', 'Blog Post', [makeField('hero_image', 'Hero Image')]);
      const findings = checkNamingConventions([ct]);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe('warning');
      expect(findings[0].id).toContain('naming-field-id');
    });

    it('flags PascalCase field ID as warning', () => {
      const ct = makeCT('blogPost', 'Blog Post', [makeField('HeroImage', 'Hero Image')]);
      const findings = checkNamingConventions([ct]);
      expect(findings[0].severity).toBe('warning');
    });
  });

  describe('field display name', () => {
    it('passes for field name starting with uppercase', () => {
      const ct = makeCT('blogPost', 'Blog Post', [makeField('heroImage', 'Hero Image')]);
      expect(checkNamingConventions([ct])).toHaveLength(0);
    });

    it('flags field name starting with lowercase as info', () => {
      const ct = makeCT('blogPost', 'Blog Post', [makeField('heroImage', 'hero image')]);
      const findings = checkNamingConventions([ct]);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe('info');
      expect(findings[0].id).toContain('naming-field-name');
    });
  });

  it('reports multiple violations across content types', () => {
    const cts = [
      makeCT('BlogPost', 'blog post'),
      makeCT('author', 'Author', [makeField('full_name', 'full name')]),
    ];
    const findings = checkNamingConventions(cts);
    expect(findings).toHaveLength(4); // ct1: id + name, ct2: field id + field name
  });
});
