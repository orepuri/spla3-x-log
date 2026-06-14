# Xマッチログ

スプラトゥーン3のXマッチ勝敗とXPを記録するアプリです。

## ローカル起動

```sh
npm install
npm run start
```

ブラウザで `http://127.0.0.1:5173` を開きます。

データを保存するには `DATABASE_URL` でPostgres接続先を指定します。Postgres込みで動かす場合はDocker Composeを使います。

## Docker Compose

```sh
cp .env.example .env
docker compose up -d --build
```

アプリはホストの `127.0.0.1:5173` にだけ公開されます。VPS上ではCaddy経由でアクセスします。

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
- Firewallで `80/tcp` と `443/tcp` をCloudflareのプロキシ元IPレンジからだけ許可
- 必要であればSSH接続元を制限
- このリポジトリをVPSへ配置
- `.env` を作成し、Postgresのユーザー名、パスワード、DB名、アプリポートを設定

`.env` は `.env.example` から作成します。

```sh
cp .env.example .env
```

本番では `POSTGRES_PASSWORD` を必ず長いランダムな値に変更します。

### 4. Caddy

Caddyで `splaxlog.toracoya.com` をアプリへリバースプロキシします。

```caddyfile
splaxlog.toracoya.com {
  encode zstd gzip
  reverse_proxy 127.0.0.1:5173
}
```

このリポジトリの `Caddyfile` を `/etc/caddy/Caddyfile` などに配置して使います。

`APP_PORT` を `5173` から変更した場合は、Caddyfileの転送先ポートも同じ値に変更します。

CaddyがTLS証明書を自動取得できるように、VPSの `80/tcp` と `443/tcp` がCloudflare経由で到達できる状態にします。

Cloudflare proxyを有効にしたままCaddyで証明書取得する場合、CloudflareのSSL/TLS modeは `Full` または `Full (strict)` を使います。運用では `Full (strict)` を推奨します。

Cloudflare AccessはCloudflare経由のリクエストだけを保護します。VPSのIPアドレスへ直接到達できるとAccessを迂回できるため、VPSのFirewallではCloudflareのプロキシ元IPレンジ以外からの `80/tcp` と `443/tcp` を拒否します。CloudflareのIPレンジは更新されることがあるため、VPS側のFirewall設定も定期的に見直します。

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

## この構成でのアプリ側対応

- `.env.example` でVPSに必要な環境変数の例を管理する。
- `docker-compose.yml` のアプリ公開ポートを `127.0.0.1` に閉じ、VPS上で直接外部公開しない。
- `Caddyfile` のサンプルをリポジトリに置く。
- Cloudflare Access経由で使う前提をREADMEに明記し、アプリ内認証は実装しない。
- Postgresデータのバックアップ/リストア手順をREADMEに残す。
- `/api/health` とDocker healthcheckで死活確認できるようにする。

残作業は、VPS上での実設定値投入、Caddyfile配置、Cloudflare Accessポリシーの許可ユーザー設定、VPS FirewallでのCloudflareプロキシ元IP制限です。

## バックアップ

PostgresデータはDocker volumeに保存されます。手動でdumpを取る場合は次を実行します。

```sh
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > spla_backup.sql
```

定期バックアップは `backup` コンテナで実行し、Cloudflare R2へアップロードします。R2でbucket scoped tokenを作成し、`.env` に次を設定します。

```env
TZ=Asia/Tokyo
BACKUP_SCHEDULE="0 6 * * *"
BACKUP_NAME_PREFIX=spla3-x-log
R2_BUCKET=splaxlog
R2_PREFIX=backups
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<access_key_id>
R2_SECRET_ACCESS_KEY=<secret_access_key>
```

`R2_ACCESS_KEY_ID` と `R2_SECRET_ACCESS_KEY` には、Cloudflare R2のS3互換API用のAccess Key IDとSecret Access Keyを設定します。`BACKUP_SCHEDULE` は `TZ` のタイムゾーンで解釈されます。上の例では毎日06:00に実行します。

バックアップコンテナ込みで起動します。

```sh
docker compose --profile backup up -d --build
```

スケジューラとバックアップ結果を確認します。

```sh
docker compose logs backup
```

すぐに1回バックアップしたい場合は、起動中の `backup` コンテナ内で実行します。

```sh
docker compose exec backup backup-postgres-to-r2.sh
```

R2側ではLifecycle ruleを設定し、`backups/` 配下を30日または90日で削除するようにします。

リストアする場合は、アプリを止めてからDBへ流し込みます。

```sh
docker compose stop app
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < spla_backup.sql
docker compose start app
```

Docker volume全体を退避する場合は、VPSのディスク容量と停止時間を確認してから実行します。

## 運用確認

ローカル到達性:

```sh
curl -fsS http://127.0.0.1:5173/api/health
```

Caddy設定確認:

```sh
caddy validate --config /etc/caddy/Caddyfile
systemctl status caddy
```

公開URL確認:

```sh
curl -I https://splaxlog.toracoya.com
```

Cloudflare Accessを有効にしている場合、未認証の `curl` はCloudflareの認証ページ、または認証要求レスポンスになります。ブラウザでGoogle認証後にアプリが表示されることを確認します。
