#!/bin/bash

echo "==============================="
echo "CSV FTP Uploader 起動中..."
echo "==============================="
echo

echo "Dockerコンテナを起動しています..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "エラー: Docker Composeの起動に失敗しました"
    echo "Dockerがインストールされているか確認してください"
    exit 1
fi

echo
echo "==============================="
echo "起動完了！"
echo "==============================="
echo
echo "アプリケーションURL:"
echo "  http://localhost:8100"
echo
echo "API URL:"
echo "  http://localhost:5000/api/health"
echo
echo "シンプルテスト画面:"
echo "  simple-test.htmlをブラウザで開いてください"
echo
echo "停止するには: docker-compose down"
echo