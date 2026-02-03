# Architecture

## Overview

CineSearch follows a feature-based architecture with clear separation of concerns, leveraging Expo and React Native best practices.

## Folder Structure

```
src/
├── core/                    # Shared utilities, types, constants
│   ├── constants/           # Theme, spacing, typography tokens
│   ├── types/              # Shared TypeScript types
│   ├── utils/              # Helper functions
│   └── services/           # Core services (offline-cache)
├── features/               # Feature-based modules
│   └── movies/            # Movies feature
│       ├── hooks/
│       └── services/
├── ui/                    # Reusable design system
│   └── components/        # Atomic components
│       ├── Button/
│       ├── Card/
│       ├── VideoPlayer/
│       └── ErrorBoundary/
├── hooks/                 # Shared custom hooks
├── providers/             # Context providers
├── store/                 # Global state stores
└── services/              # API services
```

## Key Principles

1. **Feature-based organization**: Code is grouped by feature rather than type
2. **Atomic components**: UI components are small and reusable
3. **Dependency injection**: Services are injected through hooks
4. **Type safety**: Full TypeScript coverage with strict mode

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native + Expo |
| Navigation | Expo Router |
| State Management | Zustand + TanStack Query |
| Styling | StyleSheet + Design Tokens |
| Telemetry | OpenTelemetry + Sentry |
| API | TMDB API |
