const vscode = require('vscode');
const fs = require('fs');
const os = require('os');

const CRED = os.homedir() + '/.claude/.credentials.json';
const fmt = iso => new Date(iso).toLocaleString('tr-TR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });

function activate(ctx) {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.command = 'claudeUsage.refresh';
  item.text = 'Claude …';
  item.show();

  async function refresh() {
    try {
      // token Claude Code'un kendi girişi; süresi dolunca Claude Code yeniler, biz her seferinde tekrar okuyoruz
      const token = JSON.parse(fs.readFileSync(CRED, 'utf8')).claudeAiOauth.accessToken;
      const r = await fetch('https://api.anthropic.com/api/oauth/usage', {
        headers: { Authorization: 'Bearer ' + token, 'anthropic-beta': 'oauth-2025-04-20' },
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const u = await r.json();
      const s = u.five_hour, w = u.seven_day;
      item.text = `$(sparkle) 5s ${Math.round(s.utilization)}% · 7g ${Math.round(w.utilization)}%`;
      item.tooltip = `Oturum (5 saat): %${s.utilization}, sıfırlanma ${fmt(s.resets_at)}\n` +
        `Haftalık: %${w.utilization}, sıfırlanma ${fmt(w.resets_at)}\nTıkla: yenile`;
      const max = Math.max(s.utilization, w.utilization);
      // soluk yazı rengi, arka plan boyanmaz
      item.color = max >= 90 ? '#c08a8a' : max >= 75 ? '#bfae7f' : undefined;
    } catch (e) {
      item.text = '$(sparkle) Claude ?';
      item.tooltip = 'Kullanım alınamadı: ' + e.message;
    }
  }

  ctx.subscriptions.push(item, vscode.commands.registerCommand('claudeUsage.refresh', refresh));
  refresh();
  const t = setInterval(refresh, 3 * 60 * 1000); // ponytail: sabit 3 dk; endpoint rate-limit verirse artır
  ctx.subscriptions.push({ dispose: () => clearInterval(t) });
}

module.exports = { activate };
