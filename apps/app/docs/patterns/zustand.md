# Zustand Usage Rules

## Subscription Patterns

| Situation                    | Correct Pattern                         | Prohibited Pattern               |
| ---------------------------- | --------------------------------------- | -------------------------------- |
| Subscribing to values        | `useStore((s) => s.value)`              | `const { value } = useStore()`   |
| Accessing state in callbacks | `useStore.getState().value`             | Closure over hook-derived values |
| Multiple values needed       | Individual selectors or shallow compare | Full destructuring               |

## Examples

```typescript
// GOOD: Selector syntax
const value = useStore((s) => s.value);

// GOOD: getState() in callbacks
const handler = () => {
  const { value } = useStore.getState();
};

// BAD: Destructuring (causes render cascade, detected by ast-grep)
const { value } = useStore();
```
