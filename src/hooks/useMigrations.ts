import { useCallback, useEffect, useRef, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { createClient } from 'contentful-management';
import type { EntryProps } from 'contentful-management';

export type MigrationEntry = {
  migrationName: string;
  appliedAt: string;
  appliedBy: string;
};

export type MigrationsState = {
  status: 'idle' | 'loading' | 'complete' | 'error';
  entries: MigrationEntry[];
  error?: string;
};

function getMigrationName(entry: EntryProps): string {
  const localeMap = entry.fields.migrationName as Record<string, string> | undefined;
  return localeMap ? (Object.values(localeMap)[0] ?? '') : '';
}

export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    if (typeof e.message === 'string') return e.message;
    if (typeof e.status === 'number') {
      const detail = typeof e.statusText === 'string' ? e.statusText : '';
      if (e.status === 404) return `Environment not found (404)${detail ? ': ' + detail : ''}. Check environment names.`;
      if (e.status === 403) return `Access denied (403). The app may lack permission for one of the environments.`;
      return `API error ${e.status}${detail ? ': ' + detail : ''}`;
    }
  }
  return String(err);
}

export function useMigrations(sourceEnv: string, targetEnv: string, managementToken?: string) {
  const sdk = useSDK<PageAppSDK>();
  const initialized = useRef(false);
  const isMounted = useRef(false);

  const [state, setState] = useState<MigrationsState>({
    status: 'idle',
    entries: [],
  });

  const doFetch = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading', error: undefined }));

    try {
      const spaceId = sdk.ids.space;

      const [sourceResult, targetResult] = await Promise.all([
        sdk.cma.entry.getMany({
          spaceId,
          environmentId: sourceEnv,
          query: { content_type: 'migrationHistory', limit: 1000 },
        }),
        sdk.cma.entry.getMany({
          spaceId,
          environmentId: targetEnv,
          query: { content_type: 'migrationHistory', limit: 1000 },
        }),
      ]);

      const targetNames = new Set(
        (targetResult.items as EntryProps[]).map(getMigrationName).filter(Boolean)
      );

      const missing = (sourceResult.items as EntryProps[])
        .filter((e) => {
          const name = getMigrationName(e);
          return name && !targetNames.has(name);
        })
        .sort((a, b) => new Date(b.sys.createdAt).getTime() - new Date(a.sys.createdAt).getTime());

      const userMap = new Map<string, string>();
      if (managementToken) {
        try {
          const client = createClient({ accessToken: managementToken });
          const space = await client.getSpace(spaceId);
          const users = await space.getUsers();
          for (const u of users.items) {
            const name =
              [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email || u.sys.id;
            userMap.set(u.sys.id, name);
          }
        } catch {
          // User resolution unavailable; fall back to user IDs
        }
      }

      const entries: MigrationEntry[] = missing.map((e) => {
        const userId =
          (e.sys.createdBy as { sys: { id: string } } | undefined)?.sys.id ?? '';
        return {
          migrationName: getMigrationName(e),
          appliedAt: e.sys.createdAt,
          appliedBy: userMap.get(userId) ?? userId,
        };
      });

      setState({ status: 'complete', entries });
    } catch (err) {
      console.error('[useMigrations] fetch failed:', err);
      setState((s) => ({
        ...s,
        status: 'error',
        error: extractErrorMessage(err),
      }));
    }
  }, [sdk, sourceEnv, targetEnv, managementToken]);

  // Re-fetch when envs change after first load (skip on mount)
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (initialized.current) {
      doFetch();
    }
  }, [sourceEnv, targetEnv]); // eslint-disable-line react-hooks/exhaustive-deps

  const initialize = useCallback(() => {
    if (!initialized.current) {
      initialized.current = true;
      doFetch();
    }
  }, [doFetch]);

  return { state, refresh: doFetch, initialize };
}
