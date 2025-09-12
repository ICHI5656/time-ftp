#!/bin/bash

echo "========================================"
echo "SFTPテストサーバー起動中..."
echo "========================================"

docker-compose -f docker-compose.sftp-test.yml up -d

echo ""
echo "========================================"
echo "SFTPテストサーバーが起動しました！"
echo "========================================"
echo ""
echo "接続情報:"
echo "ホスト: localhost"
echo "ポート: 2222"
echo "ユーザー名: testuser"
echo "パスワード: testpass"
echo ""
echo "テストサーバーを停止するには:"
echo "docker-compose -f docker-compose.sftp-test.yml down"
echo "========================================"