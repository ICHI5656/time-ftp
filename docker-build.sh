#!/bin/bash

echo "==============================="
echo "Docker Build - CSV FTP Uploader"
echo "==============================="
echo

# Dockerが起動しているか確認
if ! docker version > /dev/null 2>&1; then
    echo "エラー: Dockerが起動していません"
    echo "Dockerを起動してください"
    exit 1
fi

echo "[1/4] 古いコンテナを停止中..."
docker-compose down > /dev/null 2>&1

echo
echo "[2/4] Dockerイメージをビルド中..."
docker-compose build --no-cache

if [ $? -ne 0 ]; then
    echo
    echo "エラー: ビルドに失敗しました"
    exit 1
fi

echo
echo "[3/4] Dockerコンテナを起動中..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo
    echo "エラー: 起動に失敗しました"
    exit 1
fi

echo
echo "[4/4] 起動確認中..."
sleep 5

# ヘルスチェック
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo
    echo "==============================="
    echo "✅ ビルド＆起動成功！"
    echo "==============================="
    echo
    echo "アプリケーション: http://localhost:8100"
    echo "API: http://localhost:5000/api/health"
    echo
    echo "確認方法:"
    echo "1. ブラウザで http://localhost:8100 を開く"
    echo "2. または simple-test.html を開く"
    echo
    echo "ログ確認: docker-compose logs -f"
    echo "停止: docker-compose down"
else
    echo
    echo "⚠ サーバーの起動確認中..."
    echo "少し待ってから http://localhost:5000/api/health にアクセスしてください"
fi

echo