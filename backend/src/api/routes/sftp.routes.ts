import { Router, Request, Response } from 'express';
import SftpClient from 'ssh2-sftp-client';
import { logger } from '../../config/logger';

const router = Router();

function toBool(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') return ['true', '1', 'on', 'yes'].includes(val.toLowerCase());
  return false;
}

// Test SFTP connection
router.post('/test', async (req: Request, res: Response) => {
  const { host, port, username, user, password, timeoutSec } = req.body || {};
  const sftp = new SftpClient();
  try {
    await sftp.connect({
      host,
      port: port || 22,
      username: username || user,
      password,
      readyTimeout: (timeoutSec ? Number(timeoutSec) * 1000 : 30000),
      keepaliveInterval: 10000,
      keepaliveCountMax: 3
    });
    await sftp.end();
    res.json({ success: true, message: 'SFTP connection successful' });
  } catch (error: any) {
    try { await sftp.end(); } catch {}
    logger.error('SFTP connection test failed:', error);
    res.status(200).json({ success: false, error: error?.message || 'SFTP connection failed' });
  }
});

// Check directory existence
router.post('/check-directory', async (req: Request, res: Response) => {
  const { host, port, username, user, password, directory, timeoutSec } = req.body || {};
  const sftp = new SftpClient();
  try {
    await sftp.connect({
      host,
      port: port || 22,
      username: username || user,
      password,
      readyTimeout: (timeoutSec ? Number(timeoutSec) * 1000 : 30000),
      keepaliveInterval: 10000,
      keepaliveCountMax: 3
    });
    let exists = false;
    let itemCount = 0;
    try {
      const flag = await sftp.exists(directory || '/');
      exists = flag === 'd' || flag === 'l';
      if (exists) {
        const list = await sftp.list(directory || '/');
        itemCount = Array.isArray(list) ? list.length : 0;
      }
    } catch (e) {
      exists = false;
    }
    await sftp.end();
    res.json({ success: true, exists, details: { itemCount } });
  } catch (error: any) {
    try { await sftp.end(); } catch {}
    logger.error('SFTP check-directory failed:', error);
    res.status(200).json({ success: false, error: error?.message || 'SFTP check failed' });
  }
});

// Browse directory
router.post('/browse', async (req: Request, res: Response) => {
  const { host, port, username, user, password, path: dirPath, timeoutSec } = req.body || {};
  const sftp = new SftpClient();
  try {
    await sftp.connect({
      host,
      port: port || 22,
      username: username || user,
      password,
      readyTimeout: (timeoutSec ? Number(timeoutSec) * 1000 : 30000),
      keepaliveInterval: 10000,
      keepaliveCountMax: 3
    });
    const list = await sftp.list(dirPath || '/');
    await sftp.end();
    const files = (list || []).map((item: any) => ({
      name: item.name,
      type: item.type === 'd' ? 'directory' : 'file',
      size: item.size,
      modifyTime: item.modifyTime || item.modifyTimeMS || null
    }));
    res.json({ success: true, path: dirPath || '/', files });
  } catch (error: any) {
    try { await sftp.end(); } catch {}
    logger.error('SFTP browse failed:', error);
    res.status(200).json({ success: false, error: error?.message || 'SFTP browse failed', files: [] });
  }
});

export { router as sftpRoutes };
