# UI Patterns

## CSS Visibility vs Conditional Rendering

For stateful components (react-resizable-panels, etc.):

```typescript
// BAD: State loss
{sidebarVisible ? <ResizablePanel /> : null}

// GOOD: Hide with CSS
<ResizablePanel className={sidebarVisible ? '' : 'hidden'} />
```

## Component Rules

| Situation           | Pattern                         |
| ------------------- | ------------------------------- |
| Stateful components | CSS visibility (`hidden` class) |
| Class composition   | `cn()` utility                  |
| Colors              | Semantic tokens where available |

## Semantic Colors

Use semantic tokens instead of raw palette values. Token definitions: `packages/shared/src/styles/theme.css`

### Background & Container

| Usage             | Semantic Token        |
| ----------------- | --------------------- |
| Background (main) | `bg-primary`          |
| Background (alt)  | `bg-secondary`        |
| Container (main)  | `container-primary`   |
| Container (alt)   | `container-secondary` |

### Text & Icon

| Usage           | Semantic Token  |
| --------------- | --------------- |
| Text (strong)   | `text-high`     |
| Text (medium)   | `text-medium`   |
| Text (weak)     | `text-low`      |
| Text (disabled) | `text-disabled` |

### Interactive States

| Usage        | Semantic Token       |
| ------------ | -------------------- |
| Hover state  | `interactive-hover`  |
| Active state | `interactive-active` |

### Divider

| Usage          | Semantic Token      |
| -------------- | ------------------- |
| Divider (main) | `divider-primary`   |
| Divider (alt)  | `divider-secondary` |

### Status

| Usage | Semantic Token |
| ----- | -------------- |
| Error | `error`        |

> Accent/brand colors (`green-40` 등)은 semantic token이 없으므로 raw palette token을 직접 사용합니다.

### Example

```tsx
// GOOD - Semantic tokens
<div className="bg-container-primary text-text-high hover:bg-interactive-hover">

// BAD - Raw tokens where semantic exists
<div className="bg-gray-80 text-text-high hover:bg-gray-70">
```
