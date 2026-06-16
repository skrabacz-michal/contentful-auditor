export const MAX_FIELDS_PER_CONTENT_TYPE = 30;
export const STALE_CONTENT_DAYS = 365;

export const EXCLUDED_CONTENT_TYPE_IDS = new Set(['migrationHistory']);

export const FIELD_ID_REGEX = /^[a-z][a-zA-Z0-9]*$/;
export const CONTENT_TYPE_ID_REGEX = /^[a-z][a-zA-Z0-9]*$/;
export const DISPLAY_NAME_STARTS_UPPERCASE_REGEX = /^[A-Z]/;
