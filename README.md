# CSV自動FTPアップロードシステム

時間指定でCSVファイルを順番にFTPサーバーにアップロードする自動化システムです。

## 機能

- ⏰ **スケジュール管理**: 時間を指定してCSVファイルを自動アップロード
- 📁 **順次アップロード**: 複数のCSVファイルを指定順序で処理
- 🗂️ **FTPフォルダー指定**: アップロード先のディレクトリを柔軟に設定
- 🌐 **複数FTPサーバー対応**: 異なるFTPサーバーへの接続管理
- 📊 **進捗モニタリング**: リアルタイムでアップロード状況を確認
- 🔄 **エラー処理**: 失敗時の自動リトライとログ記録

## 技術スタック

- **Backend**: Node.js + TypeScript + Express
- **FTP**: basic-ftp
- **Scheduler**: node-cron
- **Queue**: Bull + Redis
- **Database**: SQLite
- **Frontend**: React + TypeScript + Vite
- **UI**: Material-UI

## クイックスタート（最も簡単）

### 1分で動作確認
```bash
# Windowsの場合
run-test.bat

# 自動的にブラウザが開きます
```

これだけで動作確認できます！

## セットアップ

### 必要環境
- Node.js 18以上
- Docker & Docker Compose (オプション)

### インストール

1. 依存関係のインストール
```bash
# バックエンド
cd backend
npm install

# フロントエンド
cd ../frontend
npm install
```

2. 環境変数の設定
```bash
cp .env.example .env
# .envファイルを編集して設定
```

3. 開発サーバーの起動
```bash
# バックエンド
cd backend
npm run dev

# フロントエンド（別ターミナル）
cd frontend
npm run dev
```

## Docker環境構築（他のPC向け）

### 必要なもの
- Docker Desktop (Windows/Mac/Linux)
- Git (オプション：コードをダウンロードする場合)

### 手順

#### 1. コードの取得
```bash
# Gitを使う場合
git clone <repository-url>
cd time-ftp

# またはZIPファイルでダウンロードして展開
```

#### 2. 環境変数の準備
```bash
# 設定ファイルをコピー
copy .env.example .env
# または
cp .env.example .env

# 必要に応じて.envファイルを編集
```

#### 3. Dockerイメージのビルドと起動

**Windows環境の場合：**
```bash
# 一括でビルド・起動（推奨）
docker-build.bat

# または個別に実行
docker-compose build   # イメージのビルド
docker-compose up -d   # コンテナ起動
```

**Mac/Linux環境の場合：**
```bash
# イメージのビルド
docker-compose build

# コンテナの起動
docker-compose up -d

# ログの確認
docker-compose logs -f
```

#### 4. アクセス確認
- **Webインターフェース**: http://localhost:8100
- **APIエンドポイント**: http://localhost:5000/api/health

### Docker管理コマンド

**Windows用バッチファイル：**
```bash
docker-build.bat   # ビルドと起動
docker-start.bat   # コンテナ起動のみ
docker-stop.bat    # コンテナ停止
```

**共通コマンド：**
```bash
# コンテナの状態確認
docker-compose ps

# ログの確認
docker-compose logs -f

# 特定サービスのログ
docker-compose logs -f backend
docker-compose logs -f frontend

# コンテナ再起動
docker-compose restart

# コンテナ停止と削除
docker-compose down

# ボリューム含めて完全削除
docker-compose down -v

# コンテナ内のシェルアクセス
docker exec -it csv-ftp-backend sh
```

### トラブルシューティング

**ポートが使用中の場合：**
`.env`ファイルでポートを変更
```
BACKEND_PORT=5001
FRONTEND_PORT=8101
REDIS_PORT=6380
```

**ビルドが失敗する場合：**
```bash
# キャッシュをクリアして再ビルド
docker-compose build --no-cache

# Dockerのクリーンアップ
docker system prune -a
```

**コンテナが起動しない場合：**
```bash
# 詳細なログを確認
docker-compose logs backend
docker-compose logs frontend

# Docker Desktopが起動しているか確認
docker version
```

## 使用方法

1. **FTP接続設定**
   - 管理画面からFTPサーバー情報を登録
   - 接続テストで確認

2. **スケジュール設定**
   - アップロードスケジュールを作成
   - cron式または簡易設定で時間指定

3. **CSVファイル管理**
   - アップロードするCSVファイルを登録
   - ドラッグ&ドロップで順序を設定

4. **実行監視**
   - ダッシュボードで状況確認
   - 履歴画面で過去の実行結果を確認

## ライセンス

MIT