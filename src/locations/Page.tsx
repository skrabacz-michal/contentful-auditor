import { PageAppSDK } from '@contentful/app-sdk';
import { Box, Button, Flex, Heading, Spinner, Tabs, Text } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import { Finding } from '../checks/types';
import { AuditProgress } from '../components/AuditProgress';
import { CategoryFilter } from '../components/CategoryFilter';
import { FindingsTable } from '../components/FindingsTable';
import { MigrationsTab } from '../components/MigrationsTab';
import { OverviewTab } from '../components/OverviewTab';
import { SummaryHeader } from '../components/SummaryHeader';
import { useAudit } from '../hooks/useAudit';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const { state, rerun } = useAudit();

  const [activeTab, setActiveTab] = useState('overview');
  const [contentModelCategory, setContentModelCategory] = useState<string | null>(null);
  const [contentCategory, setContentCategory] = useState<string | null>(null);

  useEffect(() => {
    if (state.overallStatus === 'fetching') {
      setContentModelCategory(null);
      setContentCategory(null);
    }
  }, [state.overallStatus]);

  const allFindings: Finding[] = [
    ...state.contentModel.findings,
    ...state.content.findings,
  ];

  const filteredContentModelFindings = contentModelCategory
    ? state.contentModel.findings.filter((f) => f.category === contentModelCategory)
    : state.contentModel.findings;

  const filteredContentFindings = contentCategory
    ? state.content.findings.filter((f) => f.category === contentCategory)
    : state.content.findings;

  const isRunning =
    state.overallStatus === 'fetching' ||
    state.contentModel.status === 'running' ||
    state.content.status === 'running';

  function openTarget(finding: Finding) {
    if (!finding.target) return;
    const { webapp } = sdk.hostnames;
    const base = `https://${webapp}/spaces/${sdk.ids.space}/environments/${sdk.ids.environment}`;
    const url =
      finding.target.type === 'entry'
        ? `${base}/entries/${finding.target.id}`
        : finding.target.type === 'asset'
        ? `${base}/assets/${finding.target.id}`
        : `${base}/content_types/${finding.target.id}/edit`;
    window.open(url, '_blank');
  }

  return (
    <Box padding="spacingL">
      <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingL">
        <Heading as="h1" style={{ fontSize: '2rem', lineHeight: 1.2 }}>Contentful Auditor</Heading>
        <Button variant="secondary" isDisabled={isRunning} onClick={rerun}>
          Re-run Audit
        </Button>
      </Flex>

      {state.overallStatus === 'fetching' && state.progress && (
        <AuditProgress fetched={state.progress.fetched} total={state.progress.total} />
      )}

      {state.overallStatus === 'complete' && <SummaryHeader findings={allFindings} />}

      <Tabs defaultTab="overview" onTabChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab panelId="overview">Overview</Tabs.Tab>
          <Tabs.Tab panelId="contentModel">
            Content Model
            {state.contentModel.status === 'complete' && (
              <Text fontColor="gray500" marginLeft="spacingXs">
                ({state.contentModel.findings.length})
              </Text>
            )}
          </Tabs.Tab>
          <Tabs.Tab panelId="content">
            Content
            {state.content.status === 'complete' && (
              <Text fontColor="gray500" marginLeft="spacingXs">
                ({state.content.findings.length})
              </Text>
            )}
          </Tabs.Tab>
          {state.hasMigrationHistory && (
            <Tabs.Tab panelId="migrations">Migrations</Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel id="overview">
          <Box paddingTop="spacingM">
            {state.overallStatus === 'complete' && state.metrics ? (
              <OverviewTab metrics={state.metrics} />
            ) : (
              <Flex justifyContent="center" padding="spacingXl">
                <Spinner size="large" />
              </Flex>
            )}
          </Box>
        </Tabs.Panel>

        <Tabs.Panel id="contentModel">
          <Box paddingTop="spacingM">
            {state.contentModel.status === 'complete' && (
              <CategoryFilter
                findings={state.contentModel.findings}
                selected={contentModelCategory}
                onChange={setContentModelCategory}
              />
            )}
            <FindingsTable
              status={state.contentModel.status}
              findings={filteredContentModelFindings}
              error={state.contentModel.error}
              onOpen={openTarget}
            />
          </Box>
        </Tabs.Panel>

        <Tabs.Panel id="content">
          <Box paddingTop="spacingM">
            {state.content.status === 'complete' && (
              <CategoryFilter
                findings={state.content.findings}
                selected={contentCategory}
                onChange={setContentCategory}
              />
            )}
            <FindingsTable
              status={state.content.status}
              findings={filteredContentFindings}
              error={state.content.error}
              onOpen={openTarget}
            />
          </Box>
        </Tabs.Panel>
        {state.hasMigrationHistory && (
          <Tabs.Panel id="migrations">
            <MigrationsTab isActive={activeTab === 'migrations'} />
          </Tabs.Panel>
        )}
      </Tabs>
    </Box>
  );
};

export default Page;
