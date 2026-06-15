import {
  CONTENT_TYPE_ID_REGEX,
  DISPLAY_NAME_STARTS_UPPERCASE_REGEX,
  FIELD_ID_REGEX,
} from './rules.config';

export const isCamelCaseId = (s: string) => FIELD_ID_REGEX.test(s);
export const isContentTypeIdValid = (s: string) => CONTENT_TYPE_ID_REGEX.test(s);
export const startsWithUppercase = (s: string) => DISPLAY_NAME_STARTS_UPPERCASE_REGEX.test(s);
