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
