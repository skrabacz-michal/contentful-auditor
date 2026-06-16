import { Badge, Flex, IconButton, Note, Spinner, Table, Text } from '@contentful/f36-components';
import { CopyIcon, DoneIcon } from '@contentful/f36-icons';
import { useState } from 'react';
import { CategoryStatus, Finding, Severity } from '../checks/types';

const SEVERITY_VARIANT: Record<Severity, 'negative' | 'warning' | 'secondary'> = {
  error: 'negative',
  warning: 'warning',
  info: 'secondary',
};

type Props = {
  status: CategoryStatus;
  findings: Finding[];
  error?: string;
  onOpen: (finding: Finding) => void;
};

function CopyIdButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <IconButton
      variant="transparent"
      size="small"
      aria-label="Copy ID"
      icon={copied ? <DoneIcon /> : <CopyIcon />}
      onClick={handleCopy}
    />
  );
}

export function FindingsTable({ status, findings, error, onOpen }: Props) {
  if (status === 'idle' || status === 'running') {
    return (
      <Flex justifyContent="center" padding="spacingXl">
        <Spinner size="large" />
      </Flex>
    );
  }

  if (status === 'error') {
    return (
      <Note variant="negative" title="Check failed">
        {error ?? 'An unexpected error occurred. Try re-running the audit.'}
      </Note>
    );
  }

  if (findings.length === 0) {
    return (
      <Note variant="positive" title="All checks passed">
        No issues found in this category.
      </Note>
    );
  }

  return (
    <Table>
      <Table.Head>
        <Table.Row>
          <Table.Cell>Severity</Table.Cell>
          <Table.Cell>Message</Table.Cell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {findings.map((finding) => (
          <Table.Row
            key={finding.id}
            style={{ cursor: finding.target ? 'pointer' : undefined }}
            onClick={() => finding.target && onOpen(finding)}
          >
            <Table.Cell>
              <Badge variant={SEVERITY_VARIANT[finding.severity]}>{finding.severity}</Badge>
            </Table.Cell>
            <Table.Cell>
              <Text>{finding.message}</Text>
              {finding.target && (
                <Flex alignItems="center" gap="spacingXs" marginTop="spacing2Xs">
                  <Text
                    fontColor="gray500"
                    fontSize="fontSizeS"
                    fontStack="fontStackMonospace"
                  >
                    {finding.target.id}
                  </Text>
                  <CopyIdButton id={finding.target.id} />
                </Flex>
              )}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}
