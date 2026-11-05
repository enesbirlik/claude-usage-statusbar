# Claude Usage Status Bar

Shows your Claude Code plan usage in the VS Code status bar:

```
✨ 5h 4% · 7d 82%
```

- **5h:** 5-hour session limit, **7d:** weekly limit
- Hover for reset times, click to refresh
- Refreshes every 5 minutes; all open VS Code windows share one result (a single request), so the endpoint isn't hit once per window
- On errors the last good value stays visible and the retry interval backs off up to 30 minutes
- Text turns muted yellow above 75% and muted red above 90%

## Requirements

- You must be logged in to Claude Code with a Claude account (Pro/Max). The extension reads the token from `~/.claude/.credentials.json` and only sends requests to `api.anthropic.com`.
- Works on Linux and Windows. On macOS, Claude Code stores the token in the Keychain instead of that file, so it won't work there.

## Install

Clone the repo into your VS Code extensions folder, then restart VS Code (or `Ctrl+Shift+P` → **Developer: Reload Window**).

**Linux:**
```bash
git clone https://github.com/enesbirlik/claude-usage-statusbar ~/.vscode/extensions/local.claude-usage-0.0.1
```

**Windows (PowerShell):**
```powershell
git clone https://github.com/enesbirlik/claude-usage-statusbar "$env:USERPROFILE\.vscode\extensions\local.claude-usage-0.0.1"
```

To update, run `git pull` in that folder, then Reload Window.

## Note

The `api/oauth/usage` endpoint is not an officially documented Anthropic API and may change. If it does, the status bar shows `Claude ?`; hover to see the error.
