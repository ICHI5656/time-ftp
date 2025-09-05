# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

CSV自動FTPアップロードシステム - CSVファイルを時間指定でFTPサーバーに順次アップロードする自動化システム。TypeScript/React/Express/SQLiteで構築。

## Quick Start Commands

### Windows最速起動
```bash
run-simple.bat      # バックエンド + Redis起動、HTMLインターフェース利用可能
run-test.bat        # 完全なテスト環境起動（React UIも含む）
```

### Backend Development
```bash
cd backend
npm run dev          # tsx watchモードで開発サーバー起動 (ポート5000)
npm run build        # TypeScriptコンパイル
npm run lint         # ESLintチェック
npm test             # Jestテスト実行
```

### Frontend Development  
```bash
cd frontend
npm run dev          # Vite開発サーバー起動
npm run build        # 本番ビルド
npm run lint         # ESLintチェック
```

### Docker Commands
```bash
docker-compose up -d           # 本番環境起動
docker-compose -f docker-compose-dev.yml up  # 開発環境起動
docker-compose logs -f backend # ログ確認
docker-compose down            # 停止
```

### FTP問題の修正
```bash
fix-ftp.bat          # FTP接続の重複問題を自動修正
```

## Architecture

### System Flow
```
HTML/React UI → Express API (5000) → SQLite + Redis → FTP Servers
                     ↓
              Scheduler Service (node-cron)
                     ↓  
              FTP Service (basic-ftp)
```

### Key Services & Their Responsibilities

**SchedulerService** (`backend/src/services/scheduler-service.ts`)
- Cron式でスケジュールを管理
- 起動時にDBから既存スケジュール復元
- アクティブジョブをメモリ管理

**FTPService** (`backend/src/services/ftp-service.ts`)
- basic-ftpライブラリのラッパー
- 自動リトライ (最大3回)
- エラーハンドリングとログ記録

**Database Schema** (`backend/src/db/database.ts`)
- `ftp_connections`: FTP接続情報 (name はUNIQUE制約)
- `upload_schedules`: スケジュール定義
- `file_queue`: アップロード待機キュー
- `upload_history`: 実行履歴

### API Endpoints

```
POST   /api/ftp              # FTP接続登録
POST   /api/ftp/test         # 新規接続テスト（保存なし）
POST   /api/ftp/:id/test     # 登録済み接続テスト
DELETE /api/ftp/:id          # FTP接続削除
GET    /api/ftp              # FTP接続一覧

POST   /api/schedules        # スケジュール作成
GET    /api/schedules        # スケジュール一覧
DELETE /api/schedules/:id    # スケジュール削除

POST   /api/upload           # ファイルアップロード
GET    /api/history          # アップロード履歴
```

## Critical Implementation Details

### File Size Limits (500MB)
- Backend: `express.json({ limit: '550mb' })`
- Multer: `limits: { fileSize: 500 * 1024 * 1024 }`

### FTP Connection Validation
- `secure` フィールドはカスタムサニタイザーで文字列→boolean変換
- 接続名重複時は400エラー（日本語メッセージ）

### File Upload Order
- ファイル名先頭の数字でソート: `001_file.csv`, `002_file.csv`
- `sortFilesByOrder()` 関数が制御

### Available Interfaces
React UIが動作しない場合の代替HTMLインターフェース：
- `simple-app.html` - シンプル版管理画面
- `ftp-manager.html` - FTP接続専用
- `app.html` - フル機能版

これらは `http://localhost:5000/[ファイル名]` でアクセス可能。

## Common Issues & Solutions

### FTP接続エラー (ECONNRESET)
楽天FTPサーバー接続時に発生。楽天RMS管理画面でIPアドレス制限を確認。

### 400 Bad Request
同名のFTP接続が既存。別名で登録するか既存を削除。

### React UI不応答
`run-simple.bat` でHTMLインターフェース利用。

## Testing

### Test FTP Server (動作確認用)
```javascript
{
  host: "ftp.dlptest.com",
  user: "dlpuser", 
  password: "rNrKYTX9g7z3RgJRmxWuGHbeu",
  port: 21,
  secure: false
}
```

## Environment Variables

```bash
DATABASE_PATH=./data/database.db    # SQLiteパス
REDIS_HOST=localhost                 # Redisホスト  
PORT=5000                            # バックエンドポート
FTP_DEFAULT_TIMEOUT=60000           # タイムアウト(ms)
FTP_DEFAULT_RETRY_COUNT=3           # リトライ回数
```

## Deployment

- Redis必須 (Bullキュー管理)
- データ永続化: `./data` ボリューム
- ポート: Backend 5000, Frontend 8100, Redis 6379
- Docker推奨 (`docker-compose.yml` 利用)