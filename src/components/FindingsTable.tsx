import { Badge, Button, Flex, Note, Spinner, Table, Text } from '@contentful/f36-components';
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
          <Table.Cell />
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {findings.map((finding) => (
          <Table.Row key={finding.id}>
            <Table.Cell>
              <Badge variant={SEVERITY_VARIANT[finding.severity]}>{finding.severity}</Badge>
            </Table.Cell>
            <Table.Cell>
              <Text>{finding.message}</Text>
            </Table.Cell>
            <Table.Cell align="right">
              {finding.target && (
                <Button variant="transparent" size="small" onClick={() => onOpen(finding)}>
                  Open
                </Button>
              )}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}
