// 簡易テストサーバー (Node.jsのみで動作)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;

// 簡易的なFTP接続データ（メモリ内）
let ftpConnections = [];
let schedules = [];
let uploadHistory = [];

const server = http.createServer((req, res) => {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url;
  
  // ヘルスチェック
  if (url === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      message: '簡易テストサーバー動作中'
    }));
    return;
  }

  // FTP接続一覧取得
  if (url === '/api/ftp' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(ftpConnections));
    return;
  }

  // FTP接続追加
  if (url === '/api/ftp' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const newConnection = {
          id: ftpConnections.length + 1,
          ...data,
          created_at: new Date().toISOString()
        };
        ftpConnections.push(newConnection);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newConnection));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // FTP接続テスト
  if (url.match(/^\/api\/ftp\/\d+\/test$/) && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true,
      message: 'テスト接続成功（シミュレーション）'
    }));
    return;
  }

  // スケジュール一覧取得
  if (url === '/api/schedules' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(schedules));
    return;
  }

  // スケジュール追加
  if (url === '/api/schedules' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const newSchedule = {
          id: schedules.length + 1,
          ...data,
          created_at: new Date().toISOString()
        };
        schedules.push(newSchedule);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newSchedule));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // ファイルアップロード履歴
  if (url === '/api/uploads/history' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(uploadHistory));
    return;
  }

  // 統計情報
  if (url === '/api/uploads/statistics' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      summary: {
        total_uploads: uploadHistory.length,
        successful_uploads: uploadHistory.filter(h => h.status === 'success').length,
        failed_uploads: uploadHistory.filter(h => h.status === 'failed').length,
        total_bytes_uploaded: 0
      }
    }));
    return;
  }

  // アップロード済みファイル
  if (url === '/api/uploads/files' && req.method === 'GET') {
    const uploadDir = path.join(__dirname, 'data', 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([]));
      return;
    }

    try {
      const files = fs.readdirSync(uploadDir)
        .filter(file => file.endsWith('.csv'))
        .map(file => {
          const filePath = path.join(uploadDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(files));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // CSVファイルアップロード（シンプル版）
  if (url === '/api/uploads/csv/multiple' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      // 実際のファイル保存はスキップし、成功レスポンスを返す
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'ファイルアップロード成功（シミュレーション）',
        files: []
      }));
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// データフォルダを作成
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(dataDir, 'uploads');
const processedDir = path.join(dataDir, 'processed');

[dataDir, uploadsDir, processedDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

server.listen(PORT, () => {
  console.log('===============================');
  console.log('簡易テストサーバー起動');
  console.log('===============================');
  console.log(`API: http://localhost:${PORT}/api/health`);
  console.log('simple-test.html をブラウザで開いてください');
  console.log('===============================');
});