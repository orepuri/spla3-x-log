# Xマッチログ

スプラトゥーン3のXマッチ勝敗とXPを記録するアプリです。

## ローカル起動

```sh
npm install
npm run start
```

ブラウザで `http://127.0.0.1:5173` を開きます。

`DATABASE_URL` がない場合はブラウザの `localStorage` に保存します。

## Docker Compose

```sh
cp .env.example .env
docker compose up -d --build
```

アプリは `http://<server-ip>:5173` で開きます。

PostgresのデータはDocker volume `postgres-data` に保存されます。

## 公開構成

このアプリは、さくらインターネットのVPS上でDocker Composeにより起動し、`splaxlog.toracoya.com` で公開します。

- ドメイン管理: Cloudflare
- 公開ホスト名: `splaxlog.toracoya.com`
- アクセス制限: Cloudflare Access + Google認証
- 経路: ユーザー -> Cloudflare proxy -> さくらVPS -> Caddy -> アプリ
- TLS終端: Caddy
- アプリ実行: Node.js + Postgres

Cloudflare AccessでGoogle認証を必須にするため、アプリ自体にはログイン機能を持たせず、Cloudflare側で未認証アクセスを遮断します。

## VPSデプロイ作業

### 1. Cloudflare DNS

Cloudflareで `splaxlog.toracoya.com` のDNSレコードを作成します。

- Type: `A`
- Name: `splaxlog`
- Content: さくらVPSのグローバルIPv4アドレス
- Proxy status: Proxied

IPv6を使う場合は、同じホスト名で `AAAA` レコードも追加します。

### 2. Cloudflare Access

Cloudflare Zero Trustで `splaxlog.toracoya.com` 用のAccess Applicationを作成します。

- Application type: Self-hosted
- Public hostname: `splaxlog.toracoya.com`
- Identity provider: Google
- Policy: 許可するGoogleアカウント、または許可するメールドメインだけをAllow

この設定により、Cloudflareで認証済みのユーザーだけがVPSへ到達できます。

### 3. さくらVPS

VPS側で必要なパッケージと設定を用意します。

- Docker / Docker Composeをインストール
- Caddyをインストール
- Firewallで `80/tcp` と `443/tcp` を許可
- 必要であればSSH接続元を制限
- このリポジトリをVPSへ配置
- `.env` を作成し、Postgresのユーザー名、パスワード、DB名、アプリポートを設定

### 4. Caddy

Caddyで `splaxlog.toracoya.com` をアプリへリバースプロキシします。

```caddyfile
splaxlog.toracoya.com {
  reverse_proxy 127.0.0.1:5173
}
```

CaddyがTLS証明書を自動取得できるように、VPSの `80/tcp` と `443/tcp` が外部から到達できる状態にします。

Cloudflare proxyを有効にしたままCaddyで証明書取得する場合、CloudflareのSSL/TLS modeは `Full` または `Full (strict)` を使います。運用では `Full (strict)` を推奨します。

### 5. アプリ起動

VPS上でアプリを起動します。

```sh
docker compose up -d --build
```

起動後に確認します。

```sh
docker compose ps
curl -fsS http://127.0.0.1:5173/api/health
```

ブラウザでは `https://splaxlog.toracoya.com` を開き、Cloudflare AccessのGoogle認証後にアプリが表示されることを確認します。

## この構成で必要なアプリ側作業

- `.env.example` を追加し、VPSで必要な環境変数の例を明示する。
- `docker-compose.yml` のアプリ公開ポートを必要に応じて `127.0.0.1:5173:5173` に変更し、VPS上で直接外部公開しない構成にする。
- Caddyfileのサンプルをリポジトリに追加する。
- Cloudflare Access経由で使う前提をREADMEに明記し、アプリ内認証を実装しない方針を固定する。
- Postgresデータのバックアップ/リストア手順を追加する。
- 本番運用用に、`POSTGRES_PASSWORD` を必ず強い値に変更する手順を追加する。
- `/api/health` を使った死活監視方法を整理する。
- 必要ならCloudflare Accessの認証済みユーザー情報ヘッダーをログに出さないように確認する。
