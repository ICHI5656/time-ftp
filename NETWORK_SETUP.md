# ネットワーク環境でのDocker起動ガイド

## 🚀 クイックスタート

### Windows
```bash
docker-start-network.bat
```

### Linux/Mac
```bash
./docker-start-network.sh
```

## 📋 マニュアル起動

### 1. Docker起動
```bash
docker-compose up --build -d
```

### 2. アクセス確認
- **ローカル**: http://localhost:5000/simple-app.html
- **ネットワーク**: http://[あなたのIP]:5000/simple-app.html

## 🌐 IPアドレスの確認方法

### Windows
```cmd
ipconfig
```
`IPv4 アドレス` を確認

### Linux/Mac  
```bash
hostname -I
# または
ip addr show
```

### 例（192.168.24.* ネットワーク）
```
http://192.168.24.100:5000/simple-app.html
```

## 🔧 設定内容

### docker-compose.yml
- **app**: メインアプリケーション（ポート 5000）
- **redis**: データ処理用（ポート 6379）
- **HOST**: 0.0.0.0（全ネットワークインターフェース）

### 環境変数
```env
HOST=0.0.0.0
PORT=5000
NODE_ENV=production
```

## 🛠️ トラブルシューティング

### アクセスできない場合
1. **ファイアウォール確認**
   ```bash
   # Windows
   netsh advfirewall firewall add rule name="CSV-FTP-5000" dir=in action=allow protocol=TCP localport=5000
   
   # Linux (ufw)
   sudo ufw allow 5000
   ```

2. **コンテナ状態確認**
   ```bash
   docker-compose ps
   docker-compose logs app
   ```

3. **ポート使用確認**
   ```bash
   # Windows
   netstat -an | findstr :5000
   
   # Linux/Mac
   netstat -an | grep :5000
   ```

### サービス管理
```bash
# 起動
docker-compose up -d

# 停止
docker-compose down

# 再起動
docker-compose restart

# ログ確認
docker-compose logs -f app
```

## 🔒 セキュリティ注意事項

1. **ネットワークアクセス**: 信頼できるネットワークでのみ使用
2. **ファイアウォール**: 必要なポートのみ開放
3. **認証**: 本番環境では認証機能の追加を推奨

## 📱 モバイル/タブレット対応

レスポンシブ対応済み - スマートフォンやタブレットからもアクセス可能：
```
http://[サーバーIP]:5000/simple-app.html
```

## ⚡ パフォーマンス最適化

- **Redis**: キュー処理の高速化
- **マルチステージビルド**: イメージサイズ最適化
- **ヘルスチェック**: サービス監視自動化