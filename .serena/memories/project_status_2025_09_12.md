# Time-FTP プロジェクト状況 (2025年9月12日)

## ✅ 解決済みの問題

### 1. スケジュールアップロード実行時のファイル検出問題
- **問題**: "No files found for schedule" エラー
- **原因**: scheduler-service.ts line 95のファイルパス解決ロジック
- **解決策**: パス構築ロジックを修正
```typescript
const sourceDir = schedule.source_directory === '.' || !schedule.source_directory ? baseDir : path.join(baseDir, schedule.source_directory);
```
- **状態**: 修正適用済み

### 2. ディレクトリ参照機能
- **問題**: アップロードディレクトリの参照ができない
- **解決策**: 
  - APIエンドポイント `/api/browse` は正常動作確認
  - テストツール `fix-directory-browse.html` を作成
  - フロントエンドで `/pub/example` への更新成功を確認
- **状態**: 正常動作確認済み

### 3. FTP/SFTP接続
- **Rebex SFTP (test.rebex.net)**: ✅ 正常動作
- **DLP FTP (ftp.dlptest.com)**: ❌ タイムアウト発生

## 🔧 現在の環境

### 起動中のサービス
- **メインサーバー**: http://localhost:8091 (sftp-server.js)
- **テストファイル**: data/uploads/test-schedule-2025.csv 作成済み

### 作成したドキュメント
1. **TEST_SCHEDULE_UPLOAD.md** - スケジュールアップロードテスト手順
2. **FTP_CONNECTION_GUIDE.md** - FTP/SFTP接続ガイド
3. **fix-directory-browse.html** - ディレクトリ参照テストツール

## ⚠️ 調査中の問題

### 1. サイドバー設定の反映問題
- **症状**: サイドバーで設定したアップロードディレクトリがスケジュール作成時に反映されない
- **状態**: 未調査

### 2. 送信ログ表示問題
- **症状**: アップロード完了後の送信ログが表示されない
- **状態**: 未調査

### 3. Docker環境
- **問題**: npm install時にパッケージエラー
- **回避策**: Node.js直接実行で動作確認中

## 次のアクション
1. スケジュールアップロード機能の実動作テスト
2. サイドバー設定の反映問題調査
3. 送信ログ表示問題の調査