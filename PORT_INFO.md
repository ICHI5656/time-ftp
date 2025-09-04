# ポート設定情報

このプロジェクトは他のツールとの競合を避けるため、以下のポートを使用します：

## 使用ポート

| サービス | ポート番号 | 説明 |
|---------|-----------|------|
| Backend API | 5000 | Express APIサーバー |
| Frontend Dev | 3100 | Vite開発サーバー（開発時） |
| Frontend Docker | 8100 | Nginx（本番/Docker環境） |
| Redis | 6379 | キュー管理用Redis |

## 競合回避

以下のポートは他のプロジェクトで使用されているため、避けています：

- **3000**: rakuten-store-manager等で使用
- **8000**: EC_RCSV等で使用  
- **8080**: rakuten_sku_manager等で使用

## 変更方法

ポートを変更する場合は、以下のファイルを更新してください：

1. `docker-compose.yml` - Docker環境のポート
2. `frontend/vite.config.ts` - Vite開発サーバーのポート
3. `.env.example` - 環境変数の例
4. `README.md` - ドキュメント
5. `start.bat` / `start.sh` - 起動スクリプト