# CI/CD Pipeline

## Overview

CineSearch uses GitHub Actions for CI/CD and EAS for builds.

## GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
      - run: yarn install
      - run: yarn lint
      - run: yarn typecheck

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
      - run: yarn install
      - run: yarn test:unit --coverage
```

## EAS Build Configuration

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production"
    }
  }
}
```

## Environment Variables

```bash
# .env.production
EXPO_PUBLIC_API_URL=https://api.cinesearch.com
EXPO_PUBLIC_TMDB_API_KEY=your_key
EXPO_PUBLIC_SENTRY_DSN=your_dsn
```

## Build Commands

```bash
# Development build
eas build --profile development

# Production build
eas build --profile production

# Submit to App Store
eas submit --profile production
```

## Related Files

- [`eas.json`](../eas.json)
- [`.github/workflows/`](../.github/workflows/)
