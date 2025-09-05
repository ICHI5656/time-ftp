# トラブルシューティングガイド

## 一般的な問題と解決策

### 1. FTP保存エラー: "400 Bad Request"

**エラーメッセージ**
```
Failed to load resource: the server responded with a status of 400 (Bad Request)
```

**原因**
- 同じ名前のFTP接続が既に存在する（データベースのUNIQUE制約）

**解決方法**
1. 既存の接続を削除する
```bash
curl -X DELETE http://localhost:5000/api/ftp/[ID]
```

2. 異なる名前で新規登録する
```bash
curl -X POST http://localhost:5000/api/ftp \
  -H "Content-Type: application/json" \
  -d '{"name":"新しい名前","host":"..."}'
```

3. 修正ツールを実行
```batch
fix-ftp.bat
```

### 2. FTP接続エラー: "ECONNRESET"

**エラーメッセージ**
```
Failed to connect to FTP server: Error: read ECONNRESET (control socket)
```

**原因**
- FTPサーバーのIPアドレス制限
- ファイアウォール設定
- 不正な認証情報

**解決方法**

#### 楽天FTPの場合
1. 楽天RMS管理画面でIPアドレス制限を確認
2. 現在のIPアドレスを許可リストに追加
3. FTP設定を確認:
   - ホスト: upload.rakuten.ne.jp
   - ポート: 21
   - ユーザー名/パスワードを再確認

#### テスト方法
1. 公開テストサーバーで接続確認
```javascript
// テストサーバー情報
Host: ftp.dlptest.com
User: dlpuser
Password: rNrKYTX9g7z3RgJRmxWuGHbeu
```

2. FileZillaなど別のFTPクライアントで確認

### 3. Chrome拡張エラー

**エラーメッセージ**
```
Unchecked runtime.lastError: The message port closed before a response was received
```

**原因**
- Chrome拡張機能の競合（multiVariateTestingCS.js）

**解決方法**
- 無視して問題なし（アプリケーションの動作には影響しない）

## システム診断コマンド

### ヘルスチェック
```bash
curl http://localhost:5000/api/health
```

### 登録済みFTP接続の確認
```bash
curl http://localhost:5000/api/ftp
```

### FTP接続テスト
```bash
# 保存済み接続のテスト
curl -X POST http://localhost:5000/api/ftp/[ID]/test

# 新規接続のテスト（保存なし）
curl -X POST http://localhost:5000/api/ftp/test \
  -H "Content-Type: application/json" \
  -d '{"host":"...","user":"...","password":"..."}'
```

### バックエンドログの確認
```bash
# Dockerの場合
docker logs csv-ftp-backend

# ローカル実行の場合
# ターミナルに直接表示される
```

## よくある質問

### Q: 同じ名前のFTP接続を複数作成したい
**A**: できません。各FTP接続は一意の名前が必要です。
- 例: "楽天FTP-本番"、"楽天FTP-テスト"など

### Q: FTP接続がタイムアウトする
**A**: タイムアウト設定を環境変数で調整
```bash
export FTP_DEFAULT_TIMEOUT=120000  # 120秒
```

### Q: アップロードファイルサイズ制限
**A**: 現在の制限は500MB
- backend/src/index.ts で調整可能
- Nginxを使用している場合は `client_max_body_size` も確認

## 緊急時の対処

### システム完全リセット
```bash
# 1. サービス停止
docker-compose down

# 2. データベース削除（注意：全データが消える）
rm -f ./data/database.db

# 3. サービス再起動
docker-compose up -d
```

### バックエンド強制再起動
```bash
# プロセスを確認
lsof -i :5000

# プロセスを終了
kill -9 [PID]

# 再起動
npm run dev
```

## サポート情報

- GitHubリポジトリ: https://github.com/ICHI5656/time-ftp
- 問題報告: GitHubのIssuesセクション