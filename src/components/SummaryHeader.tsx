import { Badge, Flex } from '@contentful/f36-components';
import { Finding, Severity } from '../checks/types';

function count(findings: Finding[], severity: Severity) {
  return findings.filter((f) => f.severity === severity).length;
}

type Props = { findings: Finding[] };

export function SummaryHeader({ findings }: Props) {
  const errors = count(findings, 'error');
  const warnings = count(findings, 'warning');
  const infos = count(findings, 'info');

  return (
    <Flex gap="spacingS" marginBottom="spacingL">
      <Badge variant={errors > 0 ? 'negative' : 'positive'}>
        {errors} error{errors !== 1 ? 's' : ''}
      </Badge>
      <Badge variant={warnings > 0 ? 'warning' : 'positive'}>
        {warnings} warning{warnings !== 1 ? 's' : ''}
      </Badge>
      <Badge variant="secondary">
        {infos} suggestion{infos !== 1 ? 's' : ''}
      </Badge>
    </Flex>
  );
}
