import { PageAppSDK } from '@contentful/app-sdk';
import { Box, Button, Flex, Heading, Tabs, Text } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Finding } from '../checks/types';
import { AuditProgress } from '../components/AuditProgress';
import { FindingsTable } from '../components/FindingsTable';
import { SummaryHeader } from '../components/SummaryHeader';
import { useAudit } from '../hooks/useAudit';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const { state, rerun } = useAudit();

  const allFindings: Finding[] = [
    ...state.contentModel.findings,
    ...state.content.findings,
  ];

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
        : `${base}/content_types/${finding.target.id}/edit`;
    window.open(url, '_blank');
  }

  return (
    <Box padding="spacingL">
      <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingL">
        <Heading>Contentful Auditor</Heading>
        <Button variant="secondary" isDisabled={isRunning} onClick={rerun}>
          Re-run Audit
        </Button>
      </Flex>

      {state.overallStatus === 'fetching' && state.progress && (
        <AuditProgress fetched={state.progress.fetched} total={state.progress.total} />
      )}

      {state.overallStatus === 'complete' && <SummaryHeader findings={allFindings} />}

      <Tabs defaultTab="contentModel">
        <Tabs.List>
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
        </Tabs.List>

        <Tabs.Panel id="contentModel">
          <Box paddingTop="spacingM">
            <FindingsTable
              status={state.contentModel.status}
              findings={state.contentModel.findings}
              error={state.contentModel.error}
              onOpen={openTarget}
            />
          </Box>
        </Tabs.Panel>

        <Tabs.Panel id="content">
          <Box paddingTop="spacingM">
            <FindingsTable
              status={state.content.status}
              findings={state.content.findings}
              error={state.content.error}
              onOpen={openTarget}
            />
          </Box>
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
};

export default Page;
