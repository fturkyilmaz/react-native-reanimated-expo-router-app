# Accessibility

## Overview

CineSearch follows WCAG 2.1 AA guidelines for accessibility.

## Guidelines

| Requirement | Standard |
|-------------|----------|
| Color Contrast | 4.5:1 minimum for normal text |
| Touch Targets | 44x44 points minimum |
| Screen Reader | Full VoiceOver/TalkBack support |
| Focus Order | Logical navigation |

## Accessibility Props

```tsx
<Pressable
  accessibilityLabel="Movie title, rated 8.5"
  accessibilityHint="Double tap to open details"
  accessibilityRole="button"
  accessibilityState={{ disabled: false }}
>
  {/* ... */}
</Pressable>
```

## Color Contrast Validation

```typescript
import { meetsContrastRatio } from '@/utils/accessibility';

// Check if colors meet WCAG standards
const isValid = meetsContrastRatio('#FFFFFF', '#000000'); // true
```

## Best Practices

1. Always provide `accessibilityLabel` for interactive elements
2. Add `accessibilityHint` for complex actions
3. Test with screen reader enabled
4. Ensure touch targets are large enough
5. Maintain logical focus order

## Related Files

- [`src/ui/components/Button/Button.tsx`](../src/ui/components/Button/Button.tsx)
- [`src/utils/accessibility.ts`](../src/utils/accessibility.ts)
