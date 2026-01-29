# Autostart

Login item configuration and system settings integration.

## Overview

The autostart system provides:

- "Launch at login" toggle in settings
- Integration with macOS System Settings > Login Items
- Bidirectional sync between app and system settings

## Implementation

### Plugin Configuration

```rust
// lib.rs
use tauri_plugin_autostart::MacosLauncher;
app_builder = app_builder.plugin(tauri_plugin_autostart::init(
    MacosLauncher::AppleScript,
    None,
));
```

### Available Launcher Types

| Type          | System Settings | Detection | Recommendation  |
| ------------- | --------------- | --------- | --------------- |
| `AppleScript` | Visible         | Supported | Recommended     |
| `LaunchAgent` | Not visible     | Limited   | Not recommended |

### AppleScript Method

Uses macOS native APIs to:

1. Add/remove app from Login Items via System Events
2. Query current login item status
3. Sync with System Settings changes

### Frontend Usage

```typescript
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';

// Check current status
const enabled = await isEnabled();

// Enable autostart
await enable();

// Disable autostart
await disable();
```

### Settings Integration

```typescript
// settings-screen.tsx
const [autoStart, setAutoStart] = useState(false);

useEffect(() => {
  isEnabled().then(setAutoStart);
}, []);

const handleToggle = async (enabled: boolean) => {
  if (enabled) {
    await enable();
  } else {
    await disable();
  }
  setAutoStart(enabled);
};
```

## User Experience

### Enabling Autostart

1. User toggles "Launch at login" in app settings
2. App calls `enable()` via AppleScript
3. App appears in System Settings > General > Login Items
4. Toggle reflects enabled state

### System Settings Sync

When user changes login item status directly in System Settings:

1. App can detect change via `isEnabled()`
2. Settings toggle updates to match system state
3. No restart required

## Permissions

First-time enable may prompt:

> "MOA" wants access to control "System Events"

User must click "OK" to allow. This is a one-time permission.

## Troubleshooting

| Issue                           | Solution                                       |
| ------------------------------- | ---------------------------------------------- |
| Toggle doesn't persist          | Check System Settings > Privacy > Automation   |
| App not in Login Items          | Re-enable toggle, grant Automation permission  |
| Permission dialog not appearing | Reset permissions: `tccutil reset AppleEvents` |
| Toggle state out of sync        | Call `isEnabled()` on settings screen mount    |

## Technical Details

### AppleScript Commands

**Enable:**

```applescript
tell application "System Events"
  make login item at end with properties {path:"/Applications/MOA.app", hidden:false}
end tell
```

**Disable:**

```applescript
tell application "System Events"
  delete login item "MOA"
end tell
```

**Check Status:**

```applescript
tell application "System Events"
  exists login item "MOA"
end tell
```

### Why Not LaunchAgent?

LaunchAgent (`~/Library/LaunchAgents/`) has limitations:

1. Not visible in System Settings > Login Items
2. Users can't manage it through familiar UI
3. `isEnabled()` can't detect manual file deletion
4. Requires plist file management

AppleScript method provides better UX by integrating with the standard macOS login items system.
