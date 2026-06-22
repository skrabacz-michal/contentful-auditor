import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Note,
  Select,
  Spinner,
  Table,
  Text,
  TextInput,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import { createClient } from 'contentful-management';
import { useMigrations } from '../hooks/useMigrations';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function storageKey(spaceId: string): string {
  return `migrations-env-${spaceId}`;
}

function loadConfig(spaceId: string): { source: string; target: string } {
  try {
    const raw = localStorage.getItem(storageKey(spaceId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { source: 'master', target: 'staging' };
}

interface Props {
  isActive: boolean;
}

export function MigrationsTab({ isActive }: Props) {
  const sdk = useSDK<PageAppSDK>();
  const initial = loadConfig(sdk.ids.space);

  const managementToken = (sdk.parameters.installation as { managementToken?: string } | null)?.managementToken;

  const [environments, setEnvironments] = useState<string[]>([]);
  const [sourceEnv, setSourceEnv] = useState(initial.source);
  const [targetEnv, setTargetEnv] = useState(initial.target);
  const [pendingSource, setPendingSource] = useState(initial.source);
  const [pendingTarget, setPendingTarget] = useState(initial.target);

  useEffect(() => {
    if (!managementToken) return;

    createClient({ accessToken: managementToken })
      .getSpace(sdk.ids.space)
      .then((space) => space.getEnvironments())
      .then((result) => {
        const envs = result.items.map((e) => e.sys.id);
        setEnvironments(envs);
        const saved = loadConfig(sdk.ids.space);
        const src = envs.includes(saved.source) ? saved.source : envs.includes('master') ? 'master' : envs[0] ?? saved.source;
        const tgt = envs.includes(saved.target) ? saved.target : envs.includes('staging') ? 'staging' : envs.find(e => e !== src) ?? envs[0] ?? saved.target;
        setSourceEnv(src); setTargetEnv(tgt); setPendingSource(src); setPendingTarget(tgt);
      })
      .catch((err) => console.error('[MigrationsTab] getEnvironments failed:', err));
  }, [sdk, managementToken]);

  function applyEnvs() {
    const src = pendingSource.trim();
    const tgt = pendingTarget.trim();
    if (!src || !tgt) return;
    setSourceEnv(src);
    setTargetEnv(tgt);
    localStorage.setItem(storageKey(sdk.ids.space), JSON.stringify({ source: src, target: tgt }));
  }

  const { state, refresh, initialize } = useMigrations(sourceEnv, targetEnv, managementToken);

  useEffect(() => {
    if (isActive) initialize();
  }, [isActive, initialize]);

  const isLoading = state.status === 'idle' || state.status === 'loading';
  const useSelects = environments.length > 0;

  function handleSourceChange(val: string) {
    setSourceEnv(val); setPendingSource(val);
    localStorage.setItem(storageKey(sdk.ids.space), JSON.stringify({ source: val, target: targetEnv }));
  }
  function handleTargetChange(val: string) {
    setTargetEnv(val); setPendingTarget(val);
    localStorage.setItem(storageKey(sdk.ids.space), JSON.stringify({ source: sourceEnv, target: val }));
  }

  return (
    <Box paddingTop="spacingM">
      <Flex alignItems="flex-end" gap="spacingM" marginBottom="spacingL" flexWrap="wrap">
        <Box>
          <Text fontWeight="fontWeightMedium" marginBottom="spacing2Xs" as="div">From</Text>
          {useSelects ? (
            <Select value={sourceEnv} onChange={(e) => handleSourceChange(e.target.value)}>
              {environments.map((env) => <Select.Option key={env} value={env}>{env}</Select.Option>)}
            </Select>
          ) : (
            <TextInput value={pendingSource} onChange={(e) => setPendingSource(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyEnvs()} />
          )}
        </Box>
        <Box>
          <Text fontWeight="fontWeightMedium" marginBottom="spacing2Xs" as="div">To</Text>
          {useSelects ? (
            <Select value={targetEnv} onChange={(e) => handleTargetChange(e.target.value)}>
              {environments.map((env) => <Select.Option key={env} value={env}>{env}</Select.Option>)}
            </Select>
          ) : (
            <TextInput value={pendingTarget} onChange={(e) => setPendingTarget(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyEnvs()} />
          )}
        </Box>
        {!useSelects && (
          <Button variant="secondary" isDisabled={isLoading} onClick={applyEnvs}>Compare</Button>
        )}
        <Button variant="secondary" isDisabled={isLoading} onClick={refresh}>Refresh</Button>
      </Flex>

      {isLoading && (
        <Flex justifyContent="center" padding="spacingXl">
          <Spinner size="large" />
        </Flex>
      )}

      {state.status === 'error' && (
        <Note variant="negative" title="Failed to load migrations">
          {state.error}
        </Note>
      )}

      {state.status === 'complete' && state.entries.length === 0 && (
        <Note variant="positive" title="Environments are in sync">
          No migrations in <strong>{sourceEnv}</strong> are missing from{' '}
          <strong>{targetEnv}</strong>.
        </Note>
      )}

      {state.status === 'complete' && state.entries.length > 0 && (
        <>
          <Text fontColor="gray500" marginBottom="spacingS" as="div">
            {state.entries.length} migration{state.entries.length !== 1 ? 's' : ''} in{' '}
            <strong>{sourceEnv}</strong> not found in <strong>{targetEnv}</strong>
          </Text>
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.Cell>Migration</Table.Cell>
                <Table.Cell>Applied At</Table.Cell>
                <Table.Cell>Applied By</Table.Cell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {state.entries.map((entry) => (
                <Table.Row key={entry.migrationName}>
                  <Table.Cell>
                    <Text fontStack="fontStackMonospace">{entry.migrationName}</Text>
                  </Table.Cell>
                  <Table.Cell>{formatDate(entry.appliedAt)}</Table.Cell>
                  <Table.Cell>{entry.appliedBy || '—'}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </>
      )}
    </Box>
  );
}
