import { Box, Button, Flex, Text } from '@contentful/f36-components';
import { CopyIcon, DoneIcon } from '@contentful/f36-icons';
import { useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { averageScore, Grade, MetricScores, toGrade } from '../checks/computeMetrics';

const GRADE_COLOR: Record<Grade, string> = {
  A: '#0eb87f',
  B: '#3d9e71',
  C: '#e8a619',
  D: '#e87722',
  F: '#cc3433',
};

const BADGE_SHIELD_COLOR: Record<Grade, string> = {
  A: 'brightgreen',
  B: 'green',
  C: 'yellow',
  D: 'orange',
  F: 'red',
};

const METRIC_LABELS: Record<keyof MetricScores, string> = {
  completeness: 'Completeness',
  translation: 'Translation',
  freshness: 'Freshness',
  structure: 'Structure',
  integrity: 'Integrity',
  publishRate: 'Publish Rate',
  issues: 'Issue Health',
};

const METRIC_DESCRIPTIONS: Record<keyof MetricScores, string> = {
  completeness:
    'Ratio of required fields that have a non-empty value across all entries. A low score means editors have left mandatory fields blank, which can break templates or cause rendering errors.',
  translation:
    'Average percentage of active locales covered per entry. A low score means content exists in some languages but is missing in others, leading to gaps in localised experiences.',
  freshness:
    'Share of entries updated within the last 6 months. A low score indicates content that may be outdated and should be reviewed or archived.',
  structure:
    'Ratio of entries that are referenced by at least one other entry. A low score highlights orphaned content that is unreachable from any parent entry and may be safe to delete.',
  integrity:
    'Percentage of entries whose link fields all resolve to existing entries or assets. A low score means broken references that will cause errors or empty slots in your frontend.',
  publishRate:
    'Share of entries that are currently published. A low score means a large portion of content is still in draft and not live for end users.',
  issues:
    'Weighted health score based on detected findings. Each error deducts 1 point and each warning deducts 0.2 points from a perfect 100. A low score means critical problems need attention.',
};

const DESCRIPTION_BY_LABEL: Record<string, string> = Object.fromEntries(
  (Object.keys(METRIC_LABELS) as (keyof MetricScores)[]).map((k) => [METRIC_LABELS[k], METRIC_DESCRIPTIONS[k]])
);

function scoreColor(value: number): string {
  if (value >= 75) return '#0eb87f';
  if (value >= 50) return '#e8a619';
  return '#cc3433';
}

type ChartEntry = { metric: string; value: number; fullMark: number };

function makeColoredShape(data: ChartEntry[]) {
  return function ColoredShape({ points }: { points: Array<{ x: number; y: number; cx: number; cy: number }> }) {
    if (!points?.length) return <g />;
    // In Recharts 3 the chart centre is stored on each point, not passed as a top-level prop
    const cx = points[0].cx;
    const cy = points[0].cy;
    return (
      <g>
        {points.map((point, i) => {
          const next = points[(i + 1) % points.length];
          const color = scoreColor(data[i].value);
          return (
            <path
              key={i}
              d={`M${cx},${cy} L${point.x},${point.y} L${next.x},${next.y}Z`}
              fill={color}
              fillOpacity={0.25}
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          );
        })}
      </g>
    );
  };
}

function CustomAxisTick({ x, y, payload, textAnchor, data }: {
  x: number; y: number; payload: { value: string }; textAnchor: string; data: ChartEntry[];
}) {
  const entry = data.find((d) => d.metric === payload.value);
  const color = entry ? scoreColor(entry.value) : '#536171';
  return (
    <text x={x} y={y} textAnchor={textAnchor} fill={color} fontSize={13} fontWeight={700}>
      {payload.value}
    </text>
  );
}

function CustomDot({ cx, cy, payload }: { cx: number; cy: number; payload: ChartEntry }) {
  return <circle cx={cx} cy={cy} r={7} fill={scoreColor(payload.value)} stroke="white" strokeWidth={2} />;
}

function CustomChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartEntry; value: number; name: string }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const metricLabel = item.payload?.metric ?? item.name;
  const value = item.payload?.value ?? item.value;
  const description = DESCRIPTION_BY_LABEL[metricLabel];
  return (
    <div style={{
      background: 'white',
      border: '1px solid #cfd9e0',
      borderRadius: 6,
      padding: '10px 14px',
      maxWidth: 300,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: description ? 6 : 0, color: scoreColor(value) }}>
        {metricLabel}: {value} / 100
      </div>
      {description && (
        <div style={{ fontSize: 13, color: '#536171', lineHeight: 1.5 }}>
          {description}
        </div>
      )}
    </div>
  );
}

type Props = { metrics: MetricScores };

export function OverviewTab({ metrics }: Props) {
  const [copied, setCopied] = useState(false);
  const avg = averageScore(metrics);
  const grade = toGrade(avg);
  const gradeColor = GRADE_COLOR[grade];

  const chartData: ChartEntry[] = (Object.keys(metrics) as (keyof MetricScores)[]).map((key) => ({
    metric: METRIC_LABELS[key],
    value: metrics[key],
    fullMark: 100,
  }));

  const ColoredShape = makeColoredShape(chartData);

  function copyBadge() {
    const shieldColor = BADGE_SHIELD_COLOR[grade];
    const badgeUrl = `https://img.shields.io/badge/contentful_health-${grade}-${shieldColor}`;
    navigator.clipboard.writeText(`![Contentful Health](${badgeUrl})`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <Box paddingTop="spacingL">
      <Flex gap="spacingXl" alignItems="center">
        <Box style={{ flex: '2 1 0', minWidth: 0 }}>
          <ResponsiveContainer width="100%" height={520}>
            <RadarChart data={chartData} margin={{ top: 20, right: 60, bottom: 20, left: 60 }}>
              <PolarGrid gridType="polygon" stroke="#e5ebed" />
              <PolarAngleAxis
                dataKey="metric"
                tick={(props: any) => (
                  <CustomAxisTick {...props} data={chartData} />
                )}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tickCount={5}
                tick={false}
                axisLine={false}
              />
              <Radar
                dataKey="value"
                stroke="none"
                fill="none"
                shape={(props: any) => <ColoredShape {...props} />}
                dot={(props: any) => <CustomDot {...props} />}
              />
              <RechartsTooltip content={(props: any) => <CustomChartTooltip {...props} />} />
            </RadarChart>
          </ResponsiveContainer>
        </Box>

        <Flex
          flexDirection="column"
          alignItems="center"
          gap="spacingL"
          style={{ flex: '0 0 300px', paddingRight: '32px' }}
        >
          <Box style={{ textAlign: 'center' }}>
            <Text
              style={{
                display: 'block',
                fontSize: '6rem',
                fontWeight: 700,
                lineHeight: 1,
                color: gradeColor,
              }}
            >
              {grade}
            </Text>
            <Text fontColor="gray500" style={{ fontSize: '1rem' }}>
              {avg} / 100
            </Text>
          </Box>

          <Box style={{ width: '100%' }}>
            {(Object.keys(metrics) as (keyof MetricScores)[]).map((key) => {
              const value = metrics[key];
              return (
                <Flex key={key} justifyContent="space-between" alignItems="center" marginBottom="spacingXs">
                  <Text fontSize="fontSizeS" fontColor="gray600" style={{ fontWeight: 600 }}>
                    {METRIC_LABELS[key]}
                  </Text>
                  <Text fontSize="fontSizeS" style={{ fontWeight: 700, color: scoreColor(value) }}>
                    {value}
                  </Text>
                </Flex>
              );
            })}
          </Box>

          <Button
            variant="secondary"
            size="small"
            startIcon={copied ? <DoneIcon /> : <CopyIcon />}
            onClick={copyBadge}
          >
            {copied ? 'Copied!' : 'Copy badge URL'}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
