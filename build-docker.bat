@echo off
echo ========================================
echo FTP/SFTP Manager Docker Build Script
echo ========================================
echo.

REM 既存のコンテナを停止
echo [1/5] Stopping existing containers...
docker-compose -f docker-compose.prod.yml down 2>nul

REM フロントエンドのビルド
echo [2/5] Building frontend...
cd frontend-react
call npm install
call npm run build
cd ..

REM Dockerイメージのビルド
echo [3/5] Building Docker images...
docker-compose -f docker-compose.prod.yml build --no-cache

REM コンテナの起動
echo [4/5] Starting containers...
docker-compose -f docker-compose.prod.yml up -d

REM ヘルスチェック待機
echo [5/5] Waiting for health check...
timeout /t 10 /nobreak >nul

REM ステータス表示
echo.
echo Container Status:
docker-compose -f docker-compose.prod.yml ps

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Access URLs:
echo   - Frontend: http://localhost
echo   - Backend API: http://localhost:8091/api
echo.
echo Useful Commands:
echo   - View logs: docker-compose -f docker-compose.prod.yml logs -f
echo   - Stop: docker-compose -f docker-compose.prod.yml down
echo   - Restart: docker-compose -f docker-compose.prod.yml restart
echo.
pause