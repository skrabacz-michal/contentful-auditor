import type { AssetProps, ContentTypeProps, EntryProps, LocaleProps } from 'contentful-management';
import type { Finding } from './types';

export type MetricScores = {
  completeness: number;
  translation: number;
  freshness: number;
  structure: number;
  integrity: number;
  publishRate: number;
  issues: number;
};

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

const STALE_DAYS = 182;

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function computeCompleteness(entries: EntryProps[], contentTypes: ContentTypeProps[]): number {
  const requiredFieldsByType = new Map<string, string[]>();
  for (const ct of contentTypes) {
    const required = ct.fields.filter((f) => f.required).map((f) => f.id);
    if (required.length > 0) requiredFieldsByType.set(ct.sys.id, required);
  }
  let total = 0;
  let filled = 0;
  for (const entry of entries) {
    const required = requiredFieldsByType.get(entry.sys.contentType.sys.id);
    if (!required) continue;
    for (const fieldId of required) {
      total++;
      const localeMap = entry.fields[fieldId] as Record<string, unknown> | undefined;
      if (localeMap && Object.values(localeMap).some((v) => !isEmpty(v))) filled++;
    }
  }
  return total === 0 ? 100 : Math.round((filled / total) * 100);
}

function extractMarketSuffix(tagId: string): string | null {
  const match = tagId.match(/[A-Z][a-zA-Z0-9]*$/);
  return match ? match[0] : null;
}

function computeTranslation(entries: EntryProps[], locales: LocaleProps[]): number {
  const localeCodes = locales.map((l) => l.code);
  let totalCoverage = 0;
  let taggedCount = 0;

  for (const entry of entries) {
    const tags = entry.metadata?.tags?.map((t) => t.sys.id) ?? [];
    const requiredLocales = new Set<string>();

    for (const tagId of tags) {
      const suffix = extractMarketSuffix(tagId);
      if (!suffix) continue;
      for (const code of localeCodes) {
        if (code.endsWith(`-${suffix}`)) requiredLocales.add(code);
      }
    }

    if (requiredLocales.size === 0) continue;
    taggedCount++;

    const coveredLocales = new Set<string>();
    for (const localeMap of Object.values(entry.fields)) {
      for (const [locale, value] of Object.entries(localeMap as Record<string, unknown>)) {
        if (requiredLocales.has(locale) && !isEmpty(value)) coveredLocales.add(locale);
      }
    }

    totalCoverage += coveredLocales.size / requiredLocales.size;
  }

  return taggedCount === 0 ? 100 : Math.round((totalCoverage / taggedCount) * 100);
}

function computeFreshness(entries: EntryProps[], now: Date): number {
  if (entries.length === 0) return 100;
  const thresholdMs = STALE_DAYS * 24 * 60 * 60 * 1000;
  const stale = entries.filter(
    (e) => now.getTime() - new Date(e.sys.updatedAt).getTime() > thresholdMs
  ).length;
  return Math.round((1 - stale / entries.length) * 100);
}

function computeStructure(entries: EntryProps[]): number {
  if (entries.length === 0) return 100;
  const referencedIds = new Set<string>();
  for (const entry of entries) {
    for (const localeMap of Object.values(entry.fields)) {
      for (const value of Object.values(localeMap as Record<string, unknown>)) {
        const candidates = Array.isArray(value) ? value : [value];
        for (const item of candidates) {
          if (typeof item !== 'object' || item === null) continue;
          const sys = (item as Record<string, unknown>).sys as Record<string, unknown> | undefined;
          if (sys?.type === 'Link' && sys?.linkType === 'Entry') {
            referencedIds.add(sys.id as string);
          }
        }
      }
    }
  }
  const orphans = entries.filter((e) => !referencedIds.has(e.sys.id)).length;
  return Math.round((1 - orphans / entries.length) * 100);
}

function computeIntegrity(entries: EntryProps[], assets: AssetProps[]): number {
  if (entries.length === 0) return 100;
  const validEntryIds = new Set(entries.map((e) => e.sys.id));
  const validAssetIds = new Set(assets.map((a) => a.sys.id));
  const entriesWithBroken = new Set<string>();
  for (const entry of entries) {
    for (const localeMap of Object.values(entry.fields)) {
      for (const value of Object.values(localeMap as Record<string, unknown>)) {
        const candidates = Array.isArray(value) ? value : [value];
        for (const item of candidates) {
          if (typeof item !== 'object' || item === null) continue;
          const sys = (item as Record<string, unknown>).sys as Record<string, unknown> | undefined;
          if (sys?.type === 'Link') {
            const id = sys.id as string;
            const valid =
              sys.linkType === 'Entry' ? validEntryIds.has(id) : validAssetIds.has(id);
            if (!valid) entriesWithBroken.add(entry.sys.id);
          }
        }
      }
    }
  }
  return Math.round((1 - entriesWithBroken.size / entries.length) * 100);
}

function computePublishRate(entries: EntryProps[]): number {
  if (entries.length === 0) return 100;
  const published = entries.filter((e) => e.sys.publishedVersion).length;
  return Math.round((published / entries.length) * 100);
}

function computeIssueScore(findings: Finding[]): number {
  const penalty = findings.reduce((sum, f) => {
    if (f.severity === 'error') return sum + 1;
    if (f.severity === 'warning') return sum + 0.2;
    return sum;
  }, 0);
  return Math.max(0, Math.round(100 - penalty));
}

export function computeMetrics(
  entries: EntryProps[],
  assets: AssetProps[],
  contentTypes: ContentTypeProps[],
  locales: LocaleProps[],
  findings: Finding[] = [],
  now = new Date()
): MetricScores {
  return {
    completeness: computeCompleteness(entries, contentTypes),
    translation: computeTranslation(entries, locales),
    freshness: computeFreshness(entries, now),
    structure: computeStructure(entries),
    integrity: computeIntegrity(entries, assets),
    publishRate: computePublishRate(entries),
    issues: computeIssueScore(findings),
  };
}

export function averageScore(metrics: MetricScores): number {
  const values = Object.values(metrics);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function toGrade(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}
