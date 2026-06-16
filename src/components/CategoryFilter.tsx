import { Button, Flex } from '@contentful/f36-components';
import { Finding } from '../checks/types';

type Props = {
  findings: Finding[];
  selected: string | null;
  onChange: (category: string | null) => void;
};

export function CategoryFilter({ findings, selected, onChange }: Props) {
  const categories = [...new Set(findings.map((f) => f.category).filter((c): c is string => Boolean(c)))];

  if (categories.length === 0) return null;

  return (
    <Flex gap="spacingXs" marginBottom="spacingM" flexWrap="wrap">
      <Button size="small" variant={selected === null ? 'primary' : 'secondary'} onClick={() => onChange(null)}>
        All ({findings.length})
      </Button>
      {categories.map((cat) => (
        <Button
          key={cat}
          size="small"
          variant={selected === cat ? 'primary' : 'secondary'}
          onClick={() => onChange(cat)}
        >
          {cat} ({findings.filter((f) => f.category === cat).length})
        </Button>
      ))}
    </Flex>
  );
}
