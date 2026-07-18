# favicon-getter

Google のファビコンサービスを使い、指定したサイトの favicon を取得します。

```
https://www.google.com/s2/favicons?domain=<URL>&sz=<サイズ>
```

## 使い方

### Vercel で公開

```bash
npx vercel
# 本番デプロイ
npx vercel --prod
```

- UI: `/`
- API: `/api/favicon?url=https://github.com&size=64`

### ローカルサーバー

```bash
npm start
# → http://localhost:3000
```

- UI: `http://localhost:3000`
- API: `http://localhost:3000/api/favicon?url=https://github.com&size=64`

### CLI

```bash
# 位置引数: URL とサイズ
node bin/cli.js https://github.com 64

# 名前付きパラメーター
node bin/cli.js --url https://www.google.com --size 128 --out google.png

# URL だけ表示（ダウンロードしない）
node bin/cli.js --url example.com --size 32 --url-only
```

### ライブラリ

```js
import { getFaviconUrl, getFavicon } from "./src/index.js";

// Google API の URL を組み立てる
const iconUrl = getFaviconUrl("https://github.com", 64);
// => https://www.google.com/s2/favicons?domain=github.com&sz=64

// 画像を取得する
const { buffer, contentType, sourceUrl } = await getFavicon(
  "https://github.com",
  128
);
```

## パラメーター

| 名前 | 説明 | 例 |
|------|------|-----|
| `url` | 取得したいサイトの URL またはドメイン | `https://github.com` |
| `size` | 希望するアイコンサイズ（px） | `32`, `64`, `128` |

## リモート

- https://github.com/jun01t/favicon-getter
