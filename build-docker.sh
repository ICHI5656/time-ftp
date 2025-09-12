#!/bin/bash

echo "🚀 FTP/SFTP Manager Docker Build Script"
echo "======================================"

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# エラーハンドリング
set -e

# 1. 既存のコンテナを停止
echo -e "${YELLOW}📦 既存のコンテナを停止中...${NC}"
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# 2. フロントエンドのビルド
echo -e "${YELLOW}🔨 フロントエンドをビルド中...${NC}"
cd frontend-react
npm install
npm run build
cd ..

# 3. Dockerイメージのビルド
echo -e "${YELLOW}🐳 Dockerイメージをビルド中...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

# 4. コンテナの起動
echo -e "${YELLOW}🚀 コンテナを起動中...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# 5. ヘルスチェック
echo -e "${YELLOW}❤️ ヘルスチェック中...${NC}"
sleep 10

# バックエンドのヘルスチェック
if curl -f http://localhost:8091/api/health 2>/dev/null; then
    echo -e "${GREEN}✅ バックエンド: 正常${NC}"
else
    echo -e "${RED}❌ バックエンド: エラー${NC}"
fi

# フロントエンドのヘルスチェック
if curl -f http://localhost 2>/dev/null; then
    echo -e "${GREEN}✅ フロントエンド: 正常${NC}"
else
    echo -e "${RED}❌ フロントエンド: エラー${NC}"
fi

# 6. ログの表示
echo -e "${YELLOW}📋 コンテナステータス:${NC}"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo -e "${GREEN}✨ ビルド完了！${NC}"
echo ""
echo "アクセスURL:"
echo "  - フロントエンド: http://localhost"
echo "  - バックエンドAPI: http://localhost:8091/api"
echo ""
echo "便利なコマンド:"
echo "  - ログ確認: docker-compose -f docker-compose.prod.yml logs -f"
echo "  - 停止: docker-compose -f docker-compose.prod.yml down"
echo "  - 再起動: docker-compose -f docker-compose.prod.yml restart"