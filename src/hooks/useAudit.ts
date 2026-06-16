import { useCallback, useEffect, useReducer } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { AssetProps, ContentTypeProps, EditorInterfaceProps, EntryProps } from 'contentful-management';
import { runContentChecks } from '../checks/content';
import { runContentModelChecks } from '../checks/contentModel';
import { computeMetrics, MetricScores } from '../checks/computeMetrics';
import { EXCLUDED_CONTENT_TYPE_IDS } from '../checks/rules.config';
import { CategoryStatus, Finding } from '../checks/types';

type CategoryState = {
  status: CategoryStatus;
  findings: Finding[];
  error?: string;
};

export type AuditState = {
  overallStatus: 'idle' | 'fetching' | 'complete';
  progress: { fetched: number; total: number } | null;
  contentModel: CategoryState;
  content: CategoryState;
  metrics: MetricScores | null;
};

type AuditAction =
  | { type: 'RESET' }
  | { type: 'FETCH_START' }
  | { type: 'FETCH_PROGRESS'; fetched: number; total: number }
  | { type: 'CATEGORY_COMPLETE'; category: 'contentModel' | 'content'; findings: Finding[] }
  | { type: 'CATEGORY_ERROR'; category: 'contentModel' | 'content'; error: string }
  | { type: 'COMPLETE'; metrics: MetricScores };

const idle: CategoryState = { status: 'idle', findings: [] };

const initialState: AuditState = {
  overallStatus: 'idle',
  progress: null,
  contentModel: idle,
  content: idle,
  metrics: null,
};

function reducer(state: AuditState, action: AuditAction): AuditState {
  switch (action.type) {
    case 'RESET':
      return initialState;
    case 'FETCH_START':
      return {
        ...state,
        overallStatus: 'fetching',
        progress: null,
        contentModel: { status: 'running', findings: [] },
        content: { status: 'running', findings: [] },
      };
    case 'FETCH_PROGRESS':
      return { ...state, progress: { fetched: action.fetched, total: action.total } };
    case 'CATEGORY_COMPLETE':
      return { ...state, [action.category]: { status: 'complete', findings: action.findings } };
    case 'CATEGORY_ERROR':
      return {
        ...state,
        [action.category]: { status: 'error', findings: [], error: action.error },
      };
    case 'COMPLETE':
      return { ...state, overallStatus: 'complete', progress: null, metrics: action.metrics };
    default:
      return state;
  }
}

async function fetchAllEntries(
  cma: PageAppSDK['cma'],
  onProgress: (fetched: number, total: number) => void
): Promise<EntryProps[]> {
  const PAGE_SIZE = 1000;
  const first = await cma.entry.getMany({ query: { limit: PAGE_SIZE, skip: 0 } });
  onProgress(first.items.length, first.total);

  if (first.total <= first.items.length) return first.items as EntryProps[];

  const all: EntryProps[] = [...(first.items as EntryProps[])];
  let skip = first.items.length;

  while (skip < first.total) {
    const page = await cma.entry.getMany({ query: { limit: PAGE_SIZE, skip } });
    all.push(...(page.items as EntryProps[]));
    skip += page.items.length;
    onProgress(all.length, first.total);
  }

  return all;
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'An unexpected error occurred';
}

export function useAudit() {
  const sdk = useSDK<PageAppSDK>();
  const [state, dispatch] = useReducer(reducer, initialState);

  const run = useCallback(async () => {
    dispatch({ type: 'RESET' });
    dispatch({ type: 'FETCH_START' });

    try {
      const [contentTypes, entries, assets, editorInterfaces, locales] = await Promise.all([
        sdk.cma.contentType
          .getMany({ query: { limit: 1000 } })
          .then((r) => r.items as ContentTypeProps[]),
        fetchAllEntries(sdk.cma, (fetched, total) =>
          dispatch({ type: 'FETCH_PROGRESS', fetched, total })
        ),
        sdk.cma.asset
          .getMany({ query: { limit: 1000 } })
          .then((r) => r.items as AssetProps[]),
        sdk.cma.editorInterface
          .getMany({})
          .then((r) => r.items as EditorInterfaceProps[]),
        sdk.cma.locale
          .getMany({})
          .then((r) => r.items),
      ]);

      const filteredEntries = entries.filter(
        (e) => !EXCLUDED_CONTENT_TYPE_IDS.has(e.sys.contentType.sys.id)
      );
      const filteredContentTypes = contentTypes.filter(
        (ct) => !EXCLUDED_CONTENT_TYPE_IDS.has(ct.sys.id)
      );

      const [contentModelFindings, contentFindings] = await Promise.all([
        Promise.resolve()
          .then(() => runContentModelChecks(contentTypes, editorInterfaces))
          .then((findings) => {
            dispatch({ type: 'CATEGORY_COMPLETE', category: 'contentModel', findings });
            return findings;
          })
          .catch((e) => {
            dispatch({ type: 'CATEGORY_ERROR', category: 'contentModel', error: errorMessage(e) });
            return [] as Finding[];
          }),
        Promise.resolve()
          .then(() => runContentChecks(entries, assets, contentTypes))
          .then((findings) => {
            dispatch({ type: 'CATEGORY_COMPLETE', category: 'content', findings });
            return findings;
          })
          .catch((e) => {
            dispatch({ type: 'CATEGORY_ERROR', category: 'content', error: errorMessage(e) });
            return [] as Finding[];
          }),
      ]);

      const allFindings = [...contentModelFindings, ...contentFindings];
      const metrics = computeMetrics(filteredEntries, assets, filteredContentTypes, locales.length, allFindings);
      dispatch({ type: 'COMPLETE', metrics });
    } catch (e) {
      const msg = errorMessage(e);
      dispatch({ type: 'CATEGORY_ERROR', category: 'contentModel', error: msg });
      dispatch({ type: 'CATEGORY_ERROR', category: 'content', error: msg });
      dispatch({ type: 'COMPLETE', metrics: computeMetrics([], [], [], 1, []) });
    }
  }, [sdk]);

  useEffect(() => {
    run();
  }, [run]);

  return { state, rerun: run };
}
