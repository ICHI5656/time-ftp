#!/bin/bash

echo "==============================="
echo "CSV FTP Uploader クイックセットアップ"
echo "==============================="
echo

echo "[1/3] バックエンドのセットアップ..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "エラー: バックエンドの依存関係インストールに失敗しました"
    exit 1
fi

echo
echo "[2/3] バックエンドサーバーを起動中..."
npm run dev &

echo
echo "[3/3] 起動完了！"
echo
echo "==============================="
echo "アクセス方法:"
echo "==============================="
echo
echo "1. シンプルテスト画面:"
echo "   simple-test.html をブラウザで開いてください"
echo
echo "2. API確認:"
echo "   http://localhost:5000/api/health"
echo
echo "==============================="

# Wait for server to start
sleep 5

# Try to open in browser
if command -v xdg-open > /dev/null; then
    xdg-open simple-test.html
elif command -v open > /dev/null; then
    open simple-test.html
fi

echo "Press any key to continue..."
read -n 1