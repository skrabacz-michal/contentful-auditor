import type { ContentTypeProps, EditorInterfaceProps } from 'contentful-management';
import { Finding } from '../types';

export function checkMissingHelpText(
  contentTypes: ContentTypeProps[],
  editorInterfaces: EditorInterfaceProps[]
): Finding[] {
  const eiByContentType = new Map<string, EditorInterfaceProps>();
  for (const ei of editorInterfaces) {
    eiByContentType.set(ei.sys.contentType.sys.id, ei);
  }

  const findings: Finding[] = [];

  for (const ct of contentTypes) {
    const ei = eiByContentType.get(ct.sys.id);
    const controls = ei?.controls ?? [];
    const helpTextByField = new Map(
      controls
        .filter((c) => typeof c.settings?.helpText === 'string' && (c.settings.helpText as string).trim() !== '')
        .map((c) => [c.fieldId, true])
    );

    for (const field of ct.fields) {
      if (!helpTextByField.has(field.id)) {
        findings.push({
          id: `missing-help-text-${ct.sys.id}-${field.id}`,
          severity: 'info',
          category: 'Missing Help Text',
          message: `Field "${field.id}" in content type "${ct.name}" has no help text`,
          target: { type: 'contentType', id: ct.sys.id },
        });
      }
    }
  }

  return findings;
}
