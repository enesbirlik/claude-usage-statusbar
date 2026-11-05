# Claude Usage Status Bar

VS Code'un alt çubuğunda (status bar) Claude Code plan kullanımını gösterir:

```
✨ 5s 4% · 7g 82%
```

- **5s:** 5 saatlik oturum limiti, **7g:** haftalık limit
- Üstüne gelince sıfırlanma saatleri, tıklayınca yenileme
- 5 dakikada bir yenilenir; açık tüm VS Code pencereleri sonucu paylaşır (tek istek), hata gelirse son değer kalır ve bekleme 30 dk’ya kadar uzar
- %75 üstü soluk sarı, %90 üstü soluk kırmızı yazı

## Gereksinim

- Claude Code'a Claude hesabıyla (Pro/Max) giriş yapılmış olmalı. Eklenti `~/.claude/.credentials.json` içindeki token'ı okur ve yalnızca `api.anthropic.com` adresine istek atar.
- Linux ve Windows'ta çalışır. macOS'ta Claude Code token'ı Keychain'de tuttuğu için bu dosya yoktur, orada çalışmaz.

## Kurulum

Repoyu VS Code eklenti klasörüne klonla, sonra VS Code'u yeniden başlat (ya da `Ctrl+Shift+P` → **Developer: Reload Window**).

**Linux:**
```bash
git clone https://github.com/enesbirlik/claude-usage-statusbar ~/.vscode/extensions/local.claude-usage-0.0.1
```

**Windows (PowerShell):**
```powershell
git clone https://github.com/enesbirlik/claude-usage-statusbar "$env:USERPROFILE\.vscode\extensions\local.claude-usage-0.0.1"
```

Güncellemek için o klasörde `git pull`, sonra Reload Window.

## Not

Kullanılan `api/oauth/usage` endpoint'i Anthropic'in resmi olarak belgelediği bir API değil, değişebilir. Değişirse status bar'da `Claude ?` görünür, üstüne gelince hata yazar.
