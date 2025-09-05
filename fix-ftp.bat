@echo off
echo ========================================
echo FTP接続問題の修正ツール
echo ========================================
echo.

echo 重複したFTP接続を削除しています...
curl -X DELETE http://localhost:5000/api/ftp/5
curl -X DELETE http://localhost:5000/api/ftp/6
echo.

echo 新しいFTP接続を登録しています...
echo.
echo 1. テスト用FTPサーバー (動作確認済み)
curl -X POST http://localhost:5000/api/ftp -H "Content-Type: application/json" -d "{\"name\":\"TEST Server\",\"host\":\"ftp.dlptest.com\",\"port\":21,\"user\":\"dlpuser\",\"password\":\"rNrKYTX9g7z3RgJRmxWuGHbeu\",\"secure\":false,\"default_directory\":\"/\"}"

echo.
echo 2. 楽天FTP (新規登録)
curl -X POST http://localhost:5000/api/ftp -H "Content-Type: application/json" -d "{\"name\":\"Rakuten FTP\",\"host\":\"upload.rakuten.ne.jp\",\"port\":21,\"user\":\"amicoco\",\"password\":\"AMIc0801\",\"secure\":false,\"default_directory\":\"/\"}"

echo.
echo ========================================
echo 修正完了！
echo ========================================
pause