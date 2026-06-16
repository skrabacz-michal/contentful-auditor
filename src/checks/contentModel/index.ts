import type { ContentTypeProps, EditorInterfaceProps } from 'contentful-management';
import { EXCLUDED_CONTENT_TYPE_IDS } from '../rules.config';
import { Finding } from '../types';
import { checkFieldCount } from './checkFieldCount';
import { checkMissingValidations } from './checkMissingValidations';
import { checkMissingHelpText } from './checkMissingHelpText';
import { checkNamingConventions } from './checkNamingConventions';

export function runContentModelChecks(
  contentTypes: ContentTypeProps[],
  editorInterfaces: EditorInterfaceProps[]
): Finding[] {
  const filtered = contentTypes.filter((ct) => !EXCLUDED_CONTENT_TYPE_IDS.has(ct.sys.id));
  return [
    ...checkNamingConventions(filtered),
    ...checkMissingValidations(filtered),
    ...checkFieldCount(filtered),
    ...checkMissingHelpText(filtered, editorInterfaces),
  ];
}
