@echo off
echo ===============================
echo Docker Build - CSV FTP Uploader
echo ===============================
echo.

REM Dockerが起動しているか確認
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo エラー: Dockerが起動していません
    echo Docker Desktopを起動してください
    pause
    exit /b 1
)

echo [1/4] 古いコンテナを停止中...
docker-compose down >nul 2>&1

echo.
echo [2/4] Dockerイメージをビルド中...
docker-compose build --no-cache

if %errorlevel% neq 0 (
    echo.
    echo エラー: ビルドに失敗しました
    pause
    exit /b 1
)

echo.
echo [3/4] Dockerコンテナを起動中...
docker-compose up -d

if %errorlevel% neq 0 (
    echo.
    echo エラー: 起動に失敗しました
    pause
    exit /b 1
)

echo.
echo [4/4] 起動確認中...
timeout /t 5 >nul

REM ヘルスチェック
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo ===============================
    echo ✅ ビルド＆起動成功！
    echo ===============================
    echo.
    echo アプリケーション: http://localhost:8100
    echo API: http://localhost:5000/api/health
    echo.
    echo 確認方法:
    echo 1. ブラウザで http://localhost:8100 を開く
    echo 2. または simple-test.html を開く
    echo.
    echo ログ確認: docker-compose logs -f
    echo 停止: docker-compose down
) else (
    echo.
    echo ⚠ サーバーの起動確認中...
    echo 少し待ってから http://localhost:5000/api/health にアクセスしてください
)

echo.
pause