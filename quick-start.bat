@echo off
echo ===============================
echo CSV FTP Uploader クイックセットアップ
echo ===============================
echo.

echo [1/3] バックエンドのセットアップ...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo エラー: バックエンドの依存関係インストールに失敗しました
    pause
    exit /b 1
)

echo.
echo [2/3] バックエンドサーバーを起動中...
start cmd /k "npm run dev"

echo.
echo [3/3] 起動完了！
echo.
echo ===============================
echo アクセス方法:
echo ===============================
echo.
echo 1. シンプルテスト画面:
echo    simple-test.html をブラウザで開いてください
echo.
echo 2. API確認:
echo    http://localhost:5000/api/health
echo.
echo ===============================
timeout /t 5
start "" "%~dp0simple-test.html"
echo.
pause