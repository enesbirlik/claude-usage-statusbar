const vscode = require('vscode');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CRED = os.homedir() + '/.claude/.credentials.json';
// tüm VS Code pencereleri aynı sonucu paylaşır, endpoint'e TTL'de en fazla bir kez gidilir (yoksa 429)
const CACHE = path.join(os.tmpdir(), 'claude-usage-cache.json');
const TTL = 5 * 60 * 1000;
const fmt = iso => new Date(iso).toLocaleString('tr-TR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });

const readCache = () => { try { return JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch { return {}; } };
const writeCache = c => { try { fs.writeFileSync(CACHE, JSON.stringify(c)); } catch {} };

async function fetchUsage() {
  // token Claude Code'un kendi girişi; süresi dolunca Claude Code yeniler, biz her seferinde tekrar okuyoruz
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
    const note = c.err ? `\n⚠ Son yenileme başarısız (${c.err}), tekrar denenecek` : '';
    if (!c.u) {
      item.text = '$(sparkle) Claude ?';
      item.tooltip = 'Kullanım alınamadı' + note;
      return;
    }
    const s = c.u.five_hour, w = c.u.seven_day;
    item.text = `$(sparkle) 5s ${Math.round(s.utilization)}% · 7g ${Math.round(w.utilization)}%`;
    item.tooltip = `Oturum (5 saat): %${s.utilization}, sıfırlanma ${fmt(s.resets_at)}\n` +
      `Haftalık: %${w.utilization}, sıfırlanma ${fmt(w.resets_at)}\n` +
      `Güncellendi: ${fmt(c.okAt)}${note}\nTıkla: yenile`;
    const max = Math.max(s.utilization, w.utilization);
    // soluk yazı rengi, arka plan boyanmaz
    item.color = max >= 90 ? '#c08a8a' : max >= 75 ? '#bfae7f' : undefined;
  }

  async function refresh(force) {
    const c = readCache();
    // hata üst üste gelirse bekleme katlanır: 5, 10, 20, 30 dk
    const wait = Math.min(TTL * 2 ** (c.fails || 0), 30 * 60 * 1000);
    if (!force && c.at && Date.now() - c.at < wait) return render(c);
    writeCache({ ...c, at: Date.now() }); // diğer pencereler bu arada sormasın
    try {
      const u = await fetchUsage();
      const n = { at: Date.now(), okAt: new Date().toISOString(), u };
      writeCache(n);
      render(n);
    } catch (e) {
      // hata olursa son iyi değer kalır
      const n = { ...c, at: Date.now(), err: e.message, fails: (c.fails || 0) + 1 };
      writeCache(n);
      render(n);
    }
  }

  ctx.subscriptions.push(item, vscode.commands.registerCommand('claudeUsage.refresh', () => refresh(true)));
  refresh(false);
  const t = setInterval(() => refresh(false), 60 * 1000); // dakikada bir önbelleğe bakar, ağa TTL'de bir çıkar
  ctx.subscriptions.push({ dispose: () => clearInterval(t) });
}

module.exports = { activate };
