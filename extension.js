const vscode = require('vscode');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CRED = os.homedir() + '/.claude/.credentials.json';
// all VS Code windows share one result; the endpoint is hit at most once per TTL (otherwise 429)
const CACHE = path.join(os.tmpdir(), 'claude-usage-cache.json');
const TTL = 5 * 60 * 1000;
const fmt = iso => new Date(iso).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' });

const readCache = () => { try { return JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch { return {}; } };
const writeCache = c => { try { fs.writeFileSync(CACHE, JSON.stringify(c)); } catch {} };

async function fetchUsage() {
  // Claude Code's own login token; Claude Code refreshes it on expiry, so re-read it every time
  const token = JSON.parse(fs.readFileSync(CRED, 'utf8')).claudeAiOauth.accessToken;
  const r = await fetch('https://api.anthropic.com/api/oauth/usage', {
    headers: { Authorization: 'Bearer ' + token, 'anthropic-beta': 'oauth-2025-04-20' },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

function activate(ctx) {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.command = 'claudeUsage.refresh';
  item.text = 'Claude …';
  item.show();

  function render(c) {
    const note = c.err ? `\n⚠ Last refresh failed (${c.err}), will retry` : '';
    if (!c.u) {
      item.text = '$(sparkle) Claude ?';
      item.tooltip = 'Could not fetch usage' + note;
      return;
    }
    const s = c.u.five_hour, w = c.u.seven_day;
    item.text = `$(sparkle) 5h ${Math.round(s.utilization)}% · 7d ${Math.round(w.utilization)}%`;
    item.tooltip = `Session (5h): ${s.utilization}%, resets ${fmt(s.resets_at)}\n` +
      `Weekly: ${w.utilization}%, resets ${fmt(w.resets_at)}\n` +
      `Updated: ${fmt(c.okAt)}${note}\nClick to refresh`;
    const max = Math.max(s.utilization, w.utilization);
    // muted text color, no background
    item.color = max >= 90 ? '#c08a8a' : max >= 75 ? '#bfae7f' : undefined;
  }

  async function refresh(force) {
    const c = readCache();
    // back off on repeated errors: 5, 10, 20, 30 min
    const backoff = Math.min(TTL * 2 ** (c.fails || 0), 30 * 60 * 1000);
    // a click skips the TTL but not the error backoff, and at most once a minute (spam-clicking = 429)
    const wait = force && !c.fails ? 60 * 1000 : backoff;
    if (c.at && Date.now() - c.at < wait) return render(c);
    writeCache({ ...c, at: Date.now() }); // keep other windows from fetching meanwhile
    try {
      const u = await fetchUsage();
      const n = { at: Date.now(), okAt: new Date().toISOString(), u };
      writeCache(n);
      render(n);
    } catch (e) {
      // keep the last good value on error
      const n = { ...c, at: Date.now(), err: e.message, fails: (c.fails || 0) + 1 };
      writeCache(n);
      render(n);
    }
  }

  ctx.subscriptions.push(item, vscode.commands.registerCommand('claudeUsage.refresh', () => refresh(true)));
  refresh(false);
  const t = setInterval(() => refresh(false), 60 * 1000); // check the cache every minute, hit the network once per TTL
  ctx.subscriptions.push({ dispose: () => clearInterval(t) });
}

module.exports = { activate };
