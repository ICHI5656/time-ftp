# ディレクトリブラウザAPI修正完了

## 問題
- 「エラー: ディレクトリの読み込みに失敗しました」が表示されていた
- `/api/browse`エンドポイントが未実装だった

## 解決策
- `/api/browse`エンドポイントを実装
- FTP/SFTP両プロトコル対応
- ディレクトリとファイルの区別
- 適切なエラーハンドリング

## 動作確認
- FTPテストサーバー（ftp.dlptest.com）で正常動作確認済み
- ファイルリストが正しく返される
- ディレクトリタイプの判定も正常

## エンドポイント仕様
```
POST /api/browse
Body: {
  protocol: 'ftp' | 'sftp',
  host: string,
  port: number,
  username: string,
  password: string,
  path: string
}
Response: {
  success: boolean,
  path: string,
  files: Array<{
    name: string,
    type: 'file' | 'directory',
    size: number,
    date: string
  }>
}
```