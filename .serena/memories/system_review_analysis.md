# システム見直し分析 (2025-09-08)

## 現在のシステム構成

### メインアプリケーション
- **sftp-server.js**: Express.js ベースのAPIサーバー
- **index.html**: 統合フロントエンドインターフェース (170KB+の大規模単一ファイル)
- **ポート**: 8091 (APIサーバー)

### 主要機能
1. SFTP/FTP両対応のファイルアップロード
2. 複数サーバープロファイル管理 (LocalStorage)
3. ディレクトリブラウザ機能
4. スケジュール機能
5. CSV予約アップロード
6. ファイルエンコーディング自動変換 (UTF-8/Shift-JIS)

### 技術スタック
- **Backend**: Node.js, Express, ssh2-sftp-client, basic-ftp
- **Frontend**: バニラJS (single HTML file)
- **Storage**: LocalStorage
- **File Handling**: multer, iconv-lite

### 主要API エンドポイント
- `/api/upload` - ファイルアップロード
- `/api/browse` - ディレクトリブラウザ
- `/api/test-connection` - 接続テスト
- `/api/check-directory` - ディレクトリ確認
- `/api/list-files` - ファイル一覧
- `/api/preview-file` - ファイルプレビュー

### 最近修正した問題
1. `/ritem` パス問題の完全修正
2. プロファイル管理の改善
3. ディレクトリブラウザの安定化
4. エンコーディング処理の改善

### 主要課題
1. **アーキテクチャ**: 単一HTMLファイル(170KB)の肥大化
2. **コードメンテナンス**: バニラJSによる複雑性
3. **状態管理**: LocalStorageのみに依存
4. **スケーラビリティ**: 単一サーバー構成
5. **テスト**: 自動テストの不備

### 見直し推奨事項
1. **フロントエンド分離**: React/Vue.js等への移行
2. **モジュール化**: 機能別ファイル分割
3. **データベース導入**: SQLite/PostgreSQL
4. **API設計見直し**: RESTful API標準化
5. **テスト環境構築**: Jest/Cypress等の導入