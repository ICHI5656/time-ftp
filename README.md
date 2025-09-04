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

## Docker環境

```bash
docker-compose up -d
```

アプリケーションは http://localhost:8100 でアクセスできます。

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