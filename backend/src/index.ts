import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import SftpClient from 'ssh2-sftp-client';
import net from 'net';
import { initDatabase, db } from './db/database';
import * as ftp from 'basic-ftp';
import { logger } from './config/logger';
import { ftpRoutes } from './api/routes/ftp.routes';
import { scheduleRoutes } from './api/routes/schedule.routes';
import { uploadRoutes } from './api/routes/upload.routes';
import { sftpRoutes } from './api/routes/sftp.routes';
import migrationRoutes from './api/routes/migration.routes';
import { SchedulerService } from './services/scheduler-service';
import { RetentionService } from './services/retention-service';
import { emailService } from './services/email-service';

// Load environment variables
dotenv.config();

const app = express();
// Ensure numeric port for express typings
const PORT: number = parseInt(process.env.PORT ?? '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors());
// 500MB対応のため、JSONとURLエンコードのサイズ制限を増やす
app.use(express.json({ limit: '550mb' }));
app.use(express.urlencoded({ extended: true, limit: '550mb' }));

// Static files for uploaded CSVs
app.use('/uploads', express.static(path.join(__dirname, '../../data/uploads')));

// Serve HTML interfaces
app.use(express.static(path.join(__dirname, '../../')));

// API Routes
app.use('/api/ftp', ftpRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/sftp', sftpRoutes);
app.use('/api/migration', migrationRoutes);

// Profile management API
app.get('/api/profiles', (req, res) => {
  try {
    const profiles = db.prepare('SELECT id, name, host, port, user, protocol, default_directory FROM ftp_connections WHERE is_active = 1').all();
    res.json({ success: true, profiles });
  } catch (error: any) {
    logger.error('Failed to get profiles:', error);
    res.status(500).json({ success: false, message: 'プロファイル取得に失敗しました', error: error.message });
  }
});

app.post('/api/profiles', (req, res) => {
  try {
    const { name, host, port, user, password, protocol, default_directory } = req.body;
    
    if (!name || !host || !user || !password) {
      return res.status(400).json({ success: false, message: '必須項目が不足しています' });
    }
    
    // Encode password for storage
    const encodedPassword = 'base64:' + Buffer.from(password).toString('base64');
    
    const insert = db.prepare(`
      INSERT INTO ftp_connections (name, host, port, user, password, protocol, default_directory, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);
    
    const result = insert.run(
      name,
      host,
      parseInt(port) || (protocol === 'ftp' ? 21 : 22),
      user,
      encodedPassword,
      protocol || 'sftp',
      default_directory || '/'
    );
    
    res.json({ success: true, id: result.lastInsertRowid, message: 'プロファイルが作成されました' });
    logger.info(`Profile created: ${name} (${host}:${port})`);
  } catch (error: any) {
    logger.error('Failed to create profile:', error);
    res.status(500).json({ success: false, message: 'プロファイル作成に失敗しました', error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Database status (version/schema snapshot)
app.get('/api/db/status', (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    const userVersion = (db as any).pragma?.('user_version', { simple: true }) ?? 0;
    const schemaVersion = (db as any).pragma?.('schema_version', { simple: true }) ?? null;
    const foreignKeys = (db as any).pragma?.('foreign_keys', { simple: true }) ?? null;

    const tables = (db as any)
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((t: any) => t.name);

    function tableInfo(name: string) {
      try {
        const cols = (db as any).prepare(`PRAGMA table_info(${name})`).all();
        const count = (db as any).prepare(`SELECT COUNT(*) as c FROM ${name}`).get().c;
        return { columns: cols, count };
      } catch {
        return { columns: [], count: null };
      }
    }

    const uploadSchedulesInfo = tableInfo('upload_schedules');
    const ftpConnectionsInfo = tableInfo('ftp_connections');
    const fileQueueInfo = tableInfo('file_queue');
    const uploadHistoryInfo = tableInfo('upload_history');

    const hasSelectedFiles = Array.isArray(uploadSchedulesInfo.columns)
      && uploadSchedulesInfo.columns.some((c: any) => c.name === 'selected_files');
    const hasProtocol = Array.isArray(ftpConnectionsInfo.columns)
      && ftpConnectionsInfo.columns.some((c: any) => c.name === 'protocol');
    const scheduleIdCol = Array.isArray(uploadHistoryInfo.columns)
      ? uploadHistoryInfo.columns.find((c: any) => c.name === 'schedule_id')
      : null;

    res.json({
      label: 'current_database_version_status_2025_09_13',
      timestamp,
      pragma: { user_version: userVersion, schema_version: schemaVersion, foreign_keys: foreignKeys },
      tables,
      tables_info: {
        ftp_connections: { count: ftpConnectionsInfo.count },
        upload_schedules: { count: uploadSchedulesInfo.count },
        file_queue: { count: fileQueueInfo.count },
        upload_history: { count: uploadHistoryInfo.count }
      },
      features: {
        selected_files_column: hasSelectedFiles,
        ftp_protocol_column: hasProtocol,
        upload_history_schedule_id_notnull: scheduleIdCol ? scheduleIdCol.notnull : null
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || String(e) });
  }
});

// Compatibility alias for old UI endpoint
// Old UI called POST /api/test-connection with { host, port, username, password, protocol }
app.post('/api/test-connection', async (req, res) => {
  const { host, port, username, password, protocol, timeoutSec } = req.body || {};
  const proto = String(protocol || 'sftp').toLowerCase();
  // configurable timeout (default 25s, clamp 5s..60s)
  const REQ_TIMEOUT_MS = Math.min(Math.max(Number(timeoutSec ?? 25) * 1000, 5000), 60000);
  const timeout = (ms: number) => new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
  if (proto === 'ftp' || proto === 'ftps') {
    const client = new ftp.Client(REQ_TIMEOUT_MS);
    try {
      await Promise.race([
        client.access({
          host,
          port: port || 21,
          user: username,
          password,
          secure: proto === 'ftps'
      }), timeout(REQ_TIMEOUT_MS)]);
      await client.close();
      return res.json({ success: true, message: 'Connection successful' });
    } catch (error: any) {
      try { await client.close(); } catch {}
      const msg = error?.message === 'timeout' ? `接続がタイムアウトしました (${Math.round(REQ_TIMEOUT_MS/1000)}秒)` : (error?.message || 'FTP/FTPS connection failed');
      return res.status(200).json({ success: false, error: msg });
    }
  } else {
    const sftp = new SftpClient();
    try {
      await Promise.race([
        sftp.connect({ host, port: port || 22, username, password, readyTimeout: REQ_TIMEOUT_MS }),
        timeout(REQ_TIMEOUT_MS)
      ]);
      await sftp.end();
      return res.json({ success: true, message: 'Connection successful' });
    } catch (error: any) {
      try { await sftp.end(); } catch {}
      const msg = error?.message === 'timeout' ? `接続がタイムアウトしました (${Math.round(REQ_TIMEOUT_MS/1000)}秒)` : (error?.message || 'SFTP connection failed');
      return res.status(200).json({ success: false, error: msg });
    }
  }
});

// Lightweight TCP reachability check for diagnostics
app.post('/api/tcp-check', async (req, res) => {
  try {
    const host = String(req.body?.host || '').trim();
    const port = Number(req.body?.port || 0);
    const timeoutMs = Math.min(Math.max(Number(req.body?.timeoutMs || 5000), 1000), 20000);
    if (!host || !port) return res.status(400).json({ success: false, error: 'host/port required' });
    await new Promise<void>((resolve, reject) => {
      const socket = net.createConnection({ host, port });
      const to = setTimeout(() => {
        socket.destroy();
        reject(new Error('timeout'));
      }, timeoutMs);
      socket.once('connect', () => {
        clearTimeout(to);
        socket.end();
        resolve();
      });
      socket.once('error', (err) => {
        clearTimeout(to);
        socket.destroy();
        reject(err);
      });
    });
    return res.json({ success: true, message: 'TCP reachable' });
  } catch (e: any) {
    return res.status(200).json({ success: false, error: e?.message || String(e) });
  }
});

// --- Compatibility: minimal upload + preview + list endpoints used by index.html ---
// Configure a lightweight multer storage to a shared data/uploads dir
const compatUploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../data/uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeName = (file.originalname || 'file').replace(/[^\w.\-一-龯ぁ-んァ-ン]/g, '_');
    cb(null, `${unique}-${safeName}`);
  }
});
const compatUpload = multer({ storage: compatUploadStorage, limits: { fileSize: 500 * 1024 * 1024 } });

// --- Temp upload support for scheduled UI flows ---
// Save temporary files under data/temp-uploads and return a fileId for later use
const TEMP_DIR = path.join(__dirname, '../../data/temp-uploads');
if (!fs.existsSync(TEMP_DIR)) {
  try { fs.mkdirSync(TEMP_DIR, { recursive: true }); } catch {}
}

const tempUploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try { if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true }); } catch {}
    cb(null, TEMP_DIR);
  },
  filename: (_req, file, cb) => {
    const id = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeName = (file.originalname || 'file').replace(/[^\w.\-一-龯ぁ-んァ-ン]/g, '_');
    cb(null, `${id}-${safeName}`);
  }
});
const tempUpload = multer({ storage: tempUploadStorage, limits: { fileSize: 500 * 1024 * 1024 } });

// Preview file encoding (best-effort, no external libs)
app.post('/api/preview-file', compatUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const filePath = req.file.path;
    const raw = fs.readFileSync(filePath);
    const hasUtf8Bom = raw.length >= 3 && raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf;
    const text = raw.toString('utf8');
    const hasReplacement = text.includes('\uFFFD');
    const hasJapanese = /[\u3040-\u30ff\u3400-\u9fff]/.test(text);
    const encoding = hasUtf8Bom ? 'UTF-8 (BOM)' : (hasReplacement ? 'unknown' : 'UTF-8 (no BOM)');
    const preview = text.split('\n').slice(0, 10).join('\n');
    // clean up temp file
    try { fs.unlinkSync(filePath); } catch {}
    return res.json({ success: true, filename: req.file.originalname, size: req.file.size, encoding, hasJapanese, hasMojibake: hasReplacement, preview });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Preview failed', error: err?.message || String(err) });
  }
});

// Save a file temporarily for scheduled uploads
app.post('/api/save-temp-file', tempUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const filename = req.file.filename; // <id>-<safeName>
    const id = filename.split('-')[0];
    return res.json({ success: true, fileId: id, filename: req.file.originalname, size: req.file.size });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Temp save failed', error: err?.message || String(err) });
  }
});

// Upload a single file to remote FTP/SFTP (fields: protocol, host, port, username, password, path)
// Profile-based upload endpoint
app.post('/api/upload-with-profile', compatUpload.single('file'), async (req, res) => {
  const profile_id = req.body.profile_id;
  const uploadDirectory = req.body.uploadDirectory || '/';
  
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'ファイルが選択されていません' });
  }
  
  if (!profile_id) {
    try { fs.unlinkSync(req.file.path); } catch {}
    return res.status(400).json({ success: false, message: 'プロファイルが選択されていません' });
  }

  try {
    // Get profile from database
    const profileQuery = db.prepare('SELECT * FROM ftp_connections WHERE id = ? AND is_active = 1').get(parseInt(profile_id));
    
    if (!profileQuery) {
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(400).json({ success: false, message: 'プロファイルが見つかりません' });
    }
    
    const profile: any = profileQuery as any;

    const protocol = (profile.protocol || 'sftp').toLowerCase();
    const host = profile.host;
    const port = profile.port || (protocol === 'ftp' ? 21 : 22);
    const username = profile.user;
    // Decode password from Base64 if it was encoded
    const password = profile.password.startsWith('base64:') 
      ? Buffer.from(profile.password.substring(7), 'base64').toString('utf-8')
      : profile.password;
    const filename = req.file.originalname;
    const remotePath = uploadDirectory.endsWith('/') ? `${uploadDirectory}${filename}` : `${uploadDirectory}/${filename}`;

    if (protocol === 'ftp') {
      const ftp = require('basic-ftp');
      const client = new ftp.Client();
      try {
        await client.access({ 
          host, 
          port, 
          user: username, 
          password, 
          secure: profile.secure || false 
        });
        await client.uploadFrom(req.file.path, remotePath);
        
        res.json({ 
          success: true, 
          message: 'FTPアップロード完了', 
          details: { protocol, remotePath, filename }
        });
      } finally {
        try { await client.close(); } catch {}
        try { fs.unlinkSync(req.file.path); } catch {}
      }
    } else {
      const SftpClient = require('ssh2-sftp-client');
      const sftp = new SftpClient();
      try {
        await sftp.connect({ 
          host, 
          port, 
          username, 
          password, 
          readyTimeout: 30000 
        });
        
        // Create directory if needed
        const dir = remotePath.split('/').slice(0, -1).join('/') || '/';
        if (dir && dir !== '/' && dir !== '.') {
          try { await sftp.mkdir(dir, true); } catch {}
        }
        
        await sftp.fastPut(req.file.path, remotePath);
        
        res.json({ 
          success: true, 
          message: 'SFTPアップロード完了', 
          details: { protocol, remotePath, filename }
        });
      } finally {
        try { await sftp.end(); } catch {}
        try { fs.unlinkSync(req.file.path); } catch {}
      }
    }
  } catch (error: any) {
    try { fs.unlinkSync(req.file.path); } catch {}
    logger.error('Upload failed:', error);
    res.status(500).json({ 
      success: false, 
      message: `アップロード失敗: ${error.message}` 
    });
  }
});

// Original upload endpoint (backward compatibility)
app.post('/api/upload', compatUpload.single('file'), async (req, res) => {
  const protocol = (req.body.protocol || 'sftp').toLowerCase();
  const host = req.body.host;
  const port = Number(req.body.port) || (protocol === 'ftp' ? 21 : 22);
  const username = req.body.username || req.body.user;
  const password = req.body.password;
  const remoteBase = req.body.uploadPath || req.body.path || '/';
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  if (!host || !username || !password) {
    try { fs.unlinkSync(req.file.path); } catch {}
    return res.status(400).json({ success: false, message: 'Missing host/username/password' });
  }
  const filename = req.file.originalname;
  const remotePath = remoteBase.endsWith('/') ? `${remoteBase}${filename}` : `${remoteBase}/${filename}`;

  try {
    if (protocol === 'ftp') {
      const client = new (require('basic-ftp').Client)();
      try {
        await client.access({ host, port, user: username, password, secure: !!req.body.secure });
        await client.uploadFrom(req.file.path, remotePath);
        return res.json({ success: true, message: 'FTP upload ok', details: { protocol, remotePath, filename } });
      } finally {
        try { await client.close(); } catch {}
        try { fs.unlinkSync(req.file.path); } catch {}
      }
    } else {
      const sftp = new SftpClient();
      try {
        await sftp.connect({ host, port, username, password, readyTimeout: 30000 });
        // ensure directory exists (best-effort)
        const dir = remotePath.split('/').slice(0, -1).join('/') || '/';
        if (dir && dir !== '/' && dir !== '.') {
          try { await sftp.mkdir(dir, true); } catch {}
        }
        await sftp.fastPut(req.file.path, remotePath);
        return res.json({ success: true, message: 'SFTP upload ok', details: { protocol, remotePath, filename } });
      } finally {
        try { await sftp.end(); } catch {}
        try { fs.unlinkSync(req.file.path); } catch {}
      }
    }
  } catch (err: any) {
    try { fs.unlinkSync(req.file.path); } catch {}
    return res.status(200).json({ success: false, message: 'Upload failed', error: err?.message || String(err) });
  }
});

// Upload a previously saved temp file by fileId
// JSON body: { fileId, protocol, host, port, username, password, uploadPath, secure? }
app.post('/api/upload-temp-file', async (req, res) => {
  try {
    const { fileId, protocol = 'sftp', host, port, username, password, uploadPath, secure } = req.body || {};
    if (!fileId) return res.status(400).json({ success: false, message: 'fileId required' });
    if (!host || !username || !password) return res.status(400).json({ success: false, message: 'Missing host/username/password' });

    // find file by id prefix
    let filePath: string | null = null;
    let originalName = 'file';
    const files = fs.existsSync(TEMP_DIR) ? fs.readdirSync(TEMP_DIR) : [];
    for (const f of files) {
      if (f.startsWith(String(fileId) + '-')) { filePath = path.join(TEMP_DIR, f); originalName = f.split('-').slice(1).join('-') || originalName; break; }
    }
    if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'Temp file not found' });

    const proto = String(protocol || 'sftp').toLowerCase();
    const remoteBase = uploadPath || '/';
    const remotePath = remoteBase.endsWith('/') ? `${remoteBase}${originalName}` : `${remoteBase}/${originalName}`;

    if (proto === 'ftp' || proto === 'ftps') {
      const client = new ftp.Client();
      try {
        await client.access({ host, port: Number(port) || 21, user: username, password, secure: proto === 'ftps' || !!secure });
        await client.uploadFrom(filePath, remotePath);
        return res.json({ success: true, message: 'FTP upload ok', details: { protocol: proto, remotePath, filename: originalName } });
      } catch (e: any) {
        return res.status(200).json({ success: false, message: 'Upload failed', error: e?.message || String(e) });
      } finally {
        try { await client.close(); } catch {}
        try { fs.unlinkSync(filePath); } catch {}
      }
    } else {
      const sftp = new SftpClient();
      try {
        await sftp.connect({ host, port: Number(port) || 22, username, password, readyTimeout: 30000 });
        const dir = remotePath.split('/').slice(0, -1).join('/') || '/';
        if (dir && dir !== '/' && dir !== '.') {
          try { await sftp.mkdir(dir, true); } catch {}
        }
        await sftp.fastPut(filePath, remotePath);
        return res.json({ success: true, message: 'SFTP upload ok', details: { protocol: proto, remotePath, filename: originalName } });
      } catch (e: any) {
        return res.status(200).json({ success: false, message: 'Upload failed', error: e?.message || String(e) });
      } finally {
        try { await sftp.end(); } catch {}
        try { fs.unlinkSync(filePath); } catch {}
      }
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Upload-temp failed', error: err?.message || String(err) });
  }
});

// List files for a remote directory (JSON body)
app.post('/api/list-files', async (req, res) => {
  try {
    const protocol = (req.body.protocol || 'sftp').toLowerCase();
    const host = req.body.host; const username = req.body.username || req.body.user; const password = req.body.password;
    const port = Number(req.body.port) || (protocol === 'ftp' ? 21 : 22);
    const dirPath = req.body.path || '/';
    if (!host || !username || !password) return res.status(400).json({ success: false, message: 'Missing host/username/password' });

    if (protocol === 'ftp') {
      const client = new (require('basic-ftp').Client)();
      try {
        await client.access({ host, port, user: username, password, secure: !!req.body.secure });
        const list = await client.list(dirPath);
        const files = list.map((i: any) => ({ name: i.name, type: i.type === 2 ? 'directory' : 'file', size: i.size || 0 }));
        return res.json({ success: true, path: dirPath, files });
      } finally {
        try { await client.close(); } catch {}
      }
    } else {
      const sftp = new SftpClient();
      try {
        await sftp.connect({ host, port, username, password, readyTimeout: 30000 });
        const list = await sftp.list(dirPath);
        const files = list.map((i: any) => ({ name: i.name, type: i.type === 'd' ? 'directory' : 'file', size: i.size || 0 }));
        return res.json({ success: true, path: dirPath, files });
      } finally {
        try { await sftp.end(); } catch {}
      }
    }
  } catch (err: any) {
    return res.status(200).json({ success: false, message: 'Browse failed', error: err?.message || String(err), files: [] });
  }
});

// Check directory existence on FTP/FTPS (compatibility for old UI)
app.post('/api/check-directory', async (req, res) => {
  const { host, port, username, password, protocol, directory } = req.body || {};
  const proto = String(protocol || 'sftp').toLowerCase();
  if (proto === 'ftp' || proto === 'ftps') {
    const client = new ftp.Client();
    try {
      await client.access({ host, port: port || 21, user: username, password, secure: proto === 'ftps' });
      let exists = false; let count = 0;
      try {
        const list = await client.list(directory || '/');
        exists = true; count = Array.isArray(list) ? list.length : 0;
      } catch { exists = false; }
      await client.close();
      return res.json({ success: true, exists, details: { itemCount: count } });
    } catch (error: any) {
      try { await client.close(); } catch {}
      return res.status(200).json({ success: false, error: error?.message || 'FTP/FTPS check failed' });
    }
  } else {
    const sftp = new SftpClient();
    try {
      await sftp.connect({ host, port: port || 22, username, password, readyTimeout: 30000 });
      let exists = false; let count = 0;
      try {
        const flag = await sftp.exists(directory || '/');
        exists = flag === 'd' || flag === 'l';
        if (exists) {
          const list = await sftp.list(directory || '/');
          count = Array.isArray(list) ? list.length : 0;
        }
      } catch { exists = false; }
      await sftp.end();
      return res.json({ success: true, exists, details: { itemCount: count } });
    } catch (error: any) {
      try { await sftp.end(); } catch {}
      return res.status(200).json({ success: false, error: error?.message || 'SFTP check failed' });
    }
  }
});

// Browse directory contents (directories only for old UI)
app.post('/api/browse', async (req, res) => {
  const { host, port, username, password, protocol, path: dirPath } = req.body || {};
  const proto = String(protocol || 'sftp').toLowerCase();
  if (proto === 'ftp' || proto === 'ftps') {
    const client = new ftp.Client();
    try {
      await client.access({ host, port: port || 21, user: username, password, secure: proto === 'ftps' });
      const list = await client.list(dirPath || '/');
      await client.close();
      const files = (list || []).map((item: any) => ({ name: item.name, type: item.type === 2 ? 'directory' : 'file', size: item.size, modifyTime: item.modifiedAt || null }));
      return res.json({ success: true, path: dirPath || '/', files });
    } catch (error: any) {
      try { await client.close(); } catch {}
      return res.status(200).json({ success: false, error: error?.message || 'FTP/FTPS browse failed', files: [] });
    }
  } else {
    const sftp = new SftpClient();
    try {
      await sftp.connect({ host, port: port || 22, username, password, readyTimeout: 30000 });
      let list = await sftp.list(dirPath || '/');
      const files = (list || []).map((item: any) => ({ name: item.name, type: item.type === 'd' ? 'directory' : 'file', size: item.size, modifyTime: item.modifyTime || null }));
      await sftp.end();
      return res.json({ success: true, path: dirPath || '/', files });
    } catch (error: any) {
      try { await sftp.end(); } catch {}
      return res.status(200).json({ success: false, error: error?.message || 'SFTP browse failed', files: [] });
    }
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize services and start server
const startServer = async () => {
  try {
    // Initialize database
    await initDatabase();
    logger.info('Database initialized successfully');

    // Initialize scheduler service
    const schedulerService = SchedulerService.getInstance();
    await schedulerService.initialize();
    logger.info('Scheduler service initialized');

    // Initialize retention/cleanup service (60d by default; TZ Asia/Tokyo)
    const retention = RetentionService.getInstance();
    await retention.initialize();
    logger.info('Retention service initialized');

    // Initialize email service (optional)
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        emailService.initialize({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || '587', 10),
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
        
        // Test connection
        const isConnected = await emailService.testConnection();
        if (isConnected) {
          logger.info('Email service initialized and tested successfully');
        } else {
          logger.warn('Email service initialized but connection test failed');
        }
      } catch (error: any) {
        logger.warn('Failed to initialize email service:', { error: error.message });
      }
    } else {
      logger.info('Email service skipped (missing configuration)');
    }

    // Start server
    app.listen(PORT, HOST, () => {
      logger.info(`Server is running on ${HOST}:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Access the app at: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/simple-app.html`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received. Closing server...');
  const scheduler = SchedulerService.getInstance();
  await scheduler.shutdown();
  try { await RetentionService.getInstance().shutdown(); } catch {}
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received. Closing server...');
  const scheduler = SchedulerService.getInstance();
  await scheduler.shutdown();
  try { await RetentionService.getInstance().shutdown(); } catch {}
  process.exit(0);
});
