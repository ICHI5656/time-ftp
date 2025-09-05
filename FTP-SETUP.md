# FTP接続設定ガイド

## システム動作状況

### ✅ 正常動作確認済み
- バックエンドAPI: http://localhost:5000
- HTMLインターフェース: 
  - http://localhost:5000/simple-app.html
  - http://localhost:5000/ftp-manager.html
  - http://localhost:5000/app.html
- FTP機能: テストサーバー（ftp.dlptest.com）で動作確認済み

## 楽天FTPサーバー接続について

### 現在の問題
楽天FTPサーバー（upload.rakuten.ne.jp）への接続時に`ECONNRESET`エラーが発生します。

### 考えられる原因と対処法

#### 1. IPアドレス制限
楽天RMS管理画面で以下を確認してください：
- FTP接続許可IPアドレスの設定
- 現在のグローバルIPアドレスの登録

#### 2. FTP接続方式
楽天が要求する可能性がある接続方式：
- **FTPS（明示的）**: ポート21で接続後、TLSにアップグレード
- **FTPS（暗黙的）**: ポート990で直接TLS接続
- **SFTP**: SSHベースのファイル転送（ポート22）

#### 3. パッシブモード設定
ファイアウォール環境では、パッシブモードが必要な場合があります。

### テスト済みの設定

| 設定項目 | 値 | 結果 |
|---------|-----|------|
| ホスト | upload.rakuten.ne.jp | - |
| ポート | 21 | 接続リセット |
| セキュア（FTPS） | 有効 | 接続リセット |
| セキュア（FTPS） | 無効 | 接続リセット |

### 推奨される次のステップ

1. **楽天RMS管理画面で確認**
   - FTP設定ページで詳細な接続情報を確認
   - IPアドレス制限の設定を確認
   - FTP接続マニュアルをダウンロード

2. **別のFTPクライアントでテスト**
   - FileZilla、WinSCP、Cyberduckなどで接続テスト
   - 成功した場合は、その設定を参考にシステムを調整

3. **楽天サポートへ問い合わせ**
   - FTP接続の詳細な仕様を確認
   - 必要な認証方式や暗号化設定を確認

## テスト用FTPサーバー

開発・テスト用に以下の公開FTPサーバーが利用可能です：

### ftp.dlptest.com
- ホスト: ftp.dlptest.com
- ポート: 21
- ユーザー: dlpuser
- パスワード: rNrKYTX9g7z3RgJRmxWuGHbeu
- セキュア: 無効

このサーバーでシステムの動作確認が完了しています。

## トラブルシューティング

### エラー: "UNIQUE constraint failed: ftp_connections.name"
- 原因: 同じ名前のFTP接続が既に存在
- 対処: 別の名前を使用するか、既存の接続を削除

### エラー: "ECONNRESET"
- 原因: FTPサーバーが接続を拒否
- 対処: 
  - IPアドレス制限を確認
  - ファイアウォール設定を確認
  - 認証情報を再確認

### エラー: "400 Bad Request"
- 原因: 入力データの検証エラー
- 対処: 必須フィールドがすべて入力されているか確認

## システム起動方法

### Windows（簡単起動）
```batch
run-simple.bat
```

### Docker環境
```bash
docker-compose up -d
```

### 手動起動
```bash
# 1. Redis起動
docker-compose up -d redis

# 2. バックエンド起動
cd backend
npm run dev

# 3. ブラウザでアクセス
# http://localhost:5000/simple-app.html
```