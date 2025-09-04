@echo off
echo ===============================
echo CSV FTP Uploader - テストモード
echo ===============================
echo.
echo Node.jsのみで動作する簡易版を起動します...
echo.

REM Node.jsが存在するか確認
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo エラー: Node.jsがインストールされていません
    echo https://nodejs.org/ からインストールしてください
    pause
    exit /b 1
)

echo テストサーバーを起動中...
start cmd /k "node test-server.js"

timeout /t 3 >nul

echo.
echo ===============================
echo 起動完了！
echo ===============================
echo.
echo ブラウザで simple-test.html を開いています...
start "" "%~dp0simple-test.html"

echo.
echo APIテスト: http://localhost:5000/api/health
echo.
echo 終了するには起動したコマンドウィンドウを閉じてください
echo.
pause