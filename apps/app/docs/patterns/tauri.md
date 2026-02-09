# Tauri Command Patterns

## Calling Commands

```typescript
import { commands, unwrapResult } from '~/lib/tauri-bindings';

// Basic usage
const result = await commands.loadPreferences();
if (result.status === 'ok') {
  console.log(result.data.theme);
} else {
  console.error(result.error);
}

// With TanStack Query
const { data } = useQuery({
  queryKey: ['preferences'],
  queryFn: async () => unwrapResult(await commands.loadPreferences()),
});
```

## Adding New Commands

1. **Define Rust command** - `src-tauri/src/commands/xxx.rs`
2. **Add specta::Type to types** - `#[derive(Type)]`
3. **Register in bindings.rs** - `collect_commands![]`
4. **Regenerate bindings** - `bun rust:bindings`
5. **Use in frontend** - `commands.xxx()`
