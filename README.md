# Contentful Auditor

A Contentful page-location app for Ottobock SE & Co. KGaA that audits the health of a Contentful space — content model conventions, content quality, and overall space health.

## Features

### Overview tab
- Radar chart with 7 health metrics (Completeness, Translation, Freshness, Structure, Integrity, Publish Rate, Issues)
- Per-segment colour coding (green / amber / red) based on score thresholds
- Letter grade A–F derived from the average of all metrics
- Hover tooltips on chart dots with metric description
- Copyable shields.io badge for use in repository READMEs

### Content Model tab
- Naming convention checks (content type IDs, field IDs, display names)
- Missing field validations
- Field count limit (> 30 fields per content type)
- Missing help text on editor fields

### Content tab
- Broken references (links pointing to deleted entries/assets)
- Orphaned entries (not referenced by any other entry)
- Unpublished references (links to draft entries/assets)
- Stale content (not updated in over 365 days)
- Empty required fields

All tabs support filtering findings by category.

## Health metrics

| Metric | Description |
|---|---|
| Completeness | Share of required fields with a non-empty value |
| Translation | Average locale coverage per entry |
| Freshness | Share of entries updated within the last 6 months |
| Structure | Share of entries referenced by at least one other entry |
| Integrity | Share of entries with no broken link fields |
| Publish Rate | Share of entries that are currently published |
| Issues | Weighted penalty score — errors −1 pt, warnings −0.2 pt |

## Development

```bash
npm install
npm run dev         # local dev server (http://localhost:3000)
npm run build       # production build → ./build
npm run test        # run unit tests
npm run upload-ci   # upload ./build to Contentful (requires env vars)
```

### Required environment variables

```
CONTENTFUL_ORG_ID
CONTENTFUL_APP_DEF_ID
CONTENTFUL_ACCESS_TOKEN
```

## Stack

- React 18 + TypeScript
- Vite
- Forma 36 (Contentful design system)
- Recharts 3
- Contentful App SDK + CMA SDK
