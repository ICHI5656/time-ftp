# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

CSV自動FTPアップロードシステム - CSVファイルを時間指定でFTPサーバーに順次アップロードする自動化システム。TypeScript/React/Express/SQLiteで構築され、ファイル順序制御、複数FTP接続管理、Cron式スケジューリング機能を提供。

## Development Commands

### Quick Start (Windows)
```bash
# 最速テスト環境起動
run-test.bat
```

### Backend Development
```bash
cd backend
npm install          # 初回のみ
npm run dev          # 開発サーバー起動 (tsx watch, ポート5000)
npm run build        # TypeScriptコンパイル
npm run lint         # ESLintチェック
npm test             # Jestテスト実行
```

### Frontend Development
```bash
cd frontend
npm install          # 初回のみ
npm run dev          # Vite開発サーバー起動
npm run build        # 本番ビルド
npm run lint         # ESLintチェック
```

### Docker Environment
```bash
# 本番環境起動 (Redis + Backend + Frontend)
docker-compose up -d

# アクセスURL: http://localhost:8100
```

## Architecture Overview

### System Components
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│ Express Backend │────▶│   FTP Servers   │
│   (Material-UI) │     │   (TypeScript)  │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
            ┌─────────────┐      ┌─────────────┐
            │   SQLite    │      │    Redis    │
            │  (Database) │      │   (Queue)   │
            └─────────────┘      └─────────────┘
```

### Key Backend Services

1. **SchedulerService** (`backend/src/services/scheduler-service.ts`)
   - node-cronでCron式を処理
   - アクティブなジョブをメモリで管理
   - `initialize()` でDBから既存スケジュール復元

2. **FTPService** (`backend/src/services/ftp-service.ts`)
   - basic-ftpライブラリをラップ
   - エラーハンドリングとリトライロジック
   - 並列アップロードのキュー管理

3. **Database Schema** (`backend/src/db/database.ts`)
   - `upload_schedules`: スケジュール定義 (selected_files JSONカラムでファイル指定)
   - `ftp_connections`: FTP接続情報
   - `file_queue`: アップロード待機キュー
   - `upload_history`: 実行履歴

### Frontend State Management

- **ScheduleManager.tsx**: 
  - ファイル選択モード切替 (パターンマッチ vs 個別選択)
  - cron-parserで次回実行時刻計算
  - ファイル順序表示 (001_ プレフィックス対応)

- **FileUploader.tsx**:
  - Multer経由で最大500MBファイルアップロード
  - ファイル名順序制御 (001_, 002_ 推奨形式)

## Critical Configuration

### File Size Limits (500MB対応)
- Backend: `express.json({ limit: '550mb' })`
- Multer: `limits: { fileSize: 500 * 1024 * 1024 }`
- Nginx: `client_max_body_size 550M`

### Environment Variables
```bash
# 必須設定
DATABASE_PATH=./data/database.db    # SQLiteパス
REDIS_HOST=localhost                 # Redisホスト
PORT=5000                            # バックエンドポート

# FTP設定
FTP_DEFAULT_TIMEOUT=60000           # タイムアウト (ms)
FTP_DEFAULT_RETRY_COUNT=3           # リトライ回数
```

### Cron Expression Format
```
分 時 日 月 曜日
0  9  *  *  *    = 毎日9:00
0  2  9  9  *    = 9月9日2:00
```

## Important Implementation Details

### File Upload Ordering
- ファイル名先頭の数字でソート: `001_file.csv`, `002_file.csv`
- `sortFilesByOrder()` 関数が順序を制御
- アンダースコアは任意だが推奨

### Schedule-File Binding
- `selected_files`: JSON配列として特定ファイル指定
- `file_pattern`: ワイルドカードで動的マッチング
- 両方nullの場合は全CSVファイル対象

### Error Recovery
- FTPアップロード失敗時は自動リトライ (最大3回)
- `upload_history` にエラーログ記録
- スケジューラーサービスは再起動時に自動復元

### Docker Deployment
- Redis必須 (Bullキュー管理)
- データ永続化: `./data` ボリュームマウント
- ポート: Backend 5000, Frontend 8100, Redis 6379