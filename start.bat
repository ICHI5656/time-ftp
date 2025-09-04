@echo off
echo ===============================
echo CSV FTP Uploader 起動中...
echo ===============================
echo.

echo Dockerコンテナを起動しています...
docker-compose up -d

if %errorlevel% neq 0 (
    echo エラー: Docker Composeの起動に失敗しました
    echo Dockerがインストールされているか確認してください
    pause
    exit /b 1
)

echo.
echo ===============================
echo 起動完了！
echo ===============================
echo.
echo アプリケーションURL:
echo   http://localhost:8100
echo.
echo API URL:
echo   http://localhost:5000/api/health
echo.
echo シンプルテスト画面:
echo   simple-test.htmlをブラウザで開いてください
echo.
echo 停止するには: docker-compose down
echo.
pause