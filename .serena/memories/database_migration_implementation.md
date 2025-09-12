# LocalStorage → Database 移行システム実装

## 実装完了項目

### 1. 移行サービス (migration-service.ts)
- LocalStorageデータ（プロファイル、スケジュール、履歴）をSQLiteに移行
- パスワードのBase64エンコード（本番環境では適切な暗号化必要）
- 重複データのクリーンアップ機能
- データベースバックアップ機能
- cron式への自動変換

### 2. 移行API (migration.routes.ts)
- POST /api/migration/import - データインポート
- GET /api/migration/status - 移行状態確認
- POST /api/migration/backup - バックアップ作成
- POST /api/migration/cleanup - 重複削除

### 3. 移行UI (migrate-to-db.html)
- LocalStorageデータの分析と表示
- データベース状態のリアルタイム確認
- ワンクリック移行実行
- JSONエクスポート機能
- プログレスバーとログ表示

## 既存のデータベーステーブル

### SQLiteテーブル構造
1. **ftp_connections** - FTP/SFTP接続情報
2. **upload_schedules** - アップロードスケジュール
3. **upload_history** - アップロード履歴
4. **file_queue** - ファイルキュー管理

## 移行対象データ

### LocalStorageから移行するデータ
- ftpProfiles → ftp_connections
- scheduledUploads → upload_schedules  
- uploadHistory → upload_history

## セキュリティ改善点
- パスワードのエンコード（完全な暗号化は追加実装必要）
- トランザクション処理による整合性保証
- バックアップ機能による安全性確保

## 使用方法
1. migrate-to-db.html をブラウザで開く
2. LocalStorageデータを確認
3. 「移行開始」ボタンをクリック
4. 移行完了後、重複データをクリーンアップ

## 今後の改善提案
1. bcryptによる適切なパスワードハッシュ化
2. JWT認証の実装
3. データ暗号化の強化
4. 移行履歴の記録機能