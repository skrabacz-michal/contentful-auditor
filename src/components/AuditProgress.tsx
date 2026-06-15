import { Flex, Spinner, Text } from '@contentful/f36-components';

type Props = { fetched: number; total: number };

export function AuditProgress({ fetched, total }: Props) {
  const percent = total > 0 ? Math.round((fetched / total) * 100) : 0;
  return (
    <Flex alignItems="center" gap="spacingS" marginBottom="spacingL">
      <Spinner size="small" />
      <Text>
        Fetching entries… {fetched.toLocaleString()} / {total.toLocaleString()} ({percent}%)
      </Text>
    </Flex>
  );
}
