@echo off
echo ===============================
echo CSV FTP Uploader 開発環境
echo ===============================
echo.
echo ポート設定:
echo - Backend: 5000
echo - Frontend: 3100  (Vite開発サーバー)
echo - Docker Frontend: 8100
echo.
echo 他のrakutenツールとの競合を避けるため:
echo - 3000番ポートは使用しません
echo - 8080番ポートは使用しません
echo.
echo 開発サーバーを起動するには:
echo.
echo 1. バックエンド起動:
echo    cd backend
echo    npm install
echo    npm run dev
echo.
echo 2. フロントエンド起動 (別ターミナル):
echo    cd frontend
echo    npm install
echo    npm run dev
echo.
echo フロントエンドURL: http://localhost:3100
echo API URL: http://localhost:5000
echo.
pause