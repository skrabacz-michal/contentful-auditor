import type { ContentTypeProps } from 'contentful-management';
import { Finding } from '../types';
import { checkFieldCount } from './checkFieldCount';
import { checkMissingValidations } from './checkMissingValidations';
import { checkNamingConventions } from './checkNamingConventions';

export function runContentModelChecks(contentTypes: ContentTypeProps[]): Finding[] {
  return [
    ...checkNamingConventions(contentTypes),
    ...checkMissingValidations(contentTypes),
    ...checkFieldCount(contentTypes),
  ];
}
