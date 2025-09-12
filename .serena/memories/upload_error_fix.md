# アップロードエラーの修正

## 問題
- 400 Bad Request エラー
- FTPサーバーのポートバインディングエラー
- "vsf_sysutil_bind, maximum number of attempts to find a listening port exceeded"

## 修正内容
1. **デバッグログ追加**
   - アップロードリクエストの詳細ログ
   - ファイルとボディの内容確認

2. **FTP設定の改善**
   - connTimeout: 30秒のタイムアウト設定
   - pasvTimeout: パッシブモードのタイムアウト
   - keepalive: 10秒のキープアライブ

## 対処法
- FTPサーバー（ftp.dlptest.com）の制限による可能性
- パッシブモード設定で接続の安定性向上
- タイムアウト設定で長時間接続を防止

## テスト推奨
- SFTPサーバー（test.rebex.net）でのテスト
- 小さいファイルから開始
- ブラウザのコンソールでエラー詳細確認