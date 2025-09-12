import SftpClient from 'ssh2-sftp-client';
import fs from 'fs';
import path from 'path';
import { logger } from '../config/logger';
import { addUploadHistory, db } from '../db/database';

export class SftpService {
  private client: SftpClient;
  private connectionId!: number;
  private config!: { host: string; port: number; username: string; password: string };

  constructor() {
    this.client = new SftpClient();
  }

  async connect(connectionId: number): Promise<void> {
    const connection = db.prepare('SELECT * FROM ftp_connections WHERE id = ? AND is_active = 1').get(connectionId) as any;
    if (!connection) throw new Error(`SFTP connection with ID ${connectionId} not found`);
    
    this.connectionId = connectionId;
    
    // Decode password from Base64 if it was encoded
    const password = connection.password.startsWith('base64:') 
      ? Buffer.from(connection.password.substring(7), 'base64').toString('utf-8')
      : connection.password;
    
    this.config = {
      host: connection.host,
      port: connection.port || 22,
      username: connection.user,
      password: password
    };
    
    logger.info(`Connecting to SFTP server: ${this.config.host}:${this.config.port} as ${this.config.username}`);
    await this.client.connect(this.config);
    logger.info(`Connected to SFTP server: ${this.config.host}`);
  }

  async ensureDirectory(remotePath: string): Promise<void> {
    // Recursively ensure directory
    const parts = remotePath.split('/').filter(Boolean);
    let current = '/';
    for (const part of parts) {
      current = path.posix.join(current, part);
      const exists = await this.client.exists(current);
      if (!exists) {
        await this.client.mkdir(current, true);
      }
    }
  }

  async uploadFile(localPath: string, remotePath: string, scheduleId?: number): Promise<boolean> {
    const start = Date.now();
    const fileName = path.basename(localPath);
    const fileSize = fs.existsSync(localPath) ? fs.statSync(localPath).size : 0;
    const remoteDir = path.posix.dirname(remotePath);
    try {
      if (!fs.existsSync(localPath)) throw new Error(`Local file not found: ${localPath}`);
      if (remoteDir && remoteDir !== '/' && remoteDir !== '.') await this.ensureDirectory(remoteDir);
      await this.client.fastPut(localPath, remotePath);
      const duration = Date.now() - start;
      if (scheduleId) {
        await addUploadHistory({
          schedule_id: scheduleId,
          ftp_connection_id: this.connectionId,
          file_name: fileName,
          file_size: fileSize,
          source_path: localPath,
          target_path: remotePath,
          upload_status: 'success',
          error_message: null,
          retry_count: 0,
          started_at: new Date(start).toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: duration
        });
      }
      return true;
    } catch (error: any) {
      if (scheduleId) {
        await addUploadHistory({
          schedule_id: scheduleId,
          ftp_connection_id: this.connectionId,
          file_name: fileName,
          file_size: fileSize,
          source_path: localPath,
          target_path: remotePath,
          upload_status: 'failed',
          error_message: error.message,
          retry_count: 0,
          started_at: new Date(start).toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - start
        });
      }
      throw error;
    }
  }

  async uploadMultipleFiles(files: Array<{ localPath: string; remotePath: string }>, scheduleId?: number) {
    const results: Array<{ file: string; success: boolean; error?: string }> = [];
    for (const f of files) {
      try {
        await this.uploadFile(f.localPath, f.remotePath, scheduleId);
        results.push({ file: f.localPath, success: true });
      } catch (e: any) {
        results.push({ file: f.localPath, success: false, error: e.message });
      }
    }
    return results;
  }

  async listFiles(remotePath: string = '/'): Promise<Array<{ name: string; type: string; size: number }>> {
    const list = await this.client.list(remotePath);
    return list.map((i) => ({ name: i.name, type: i.type === 'd' ? 'directory' : 'file', size: i.size }));
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.list('/');
      return true;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try { await this.client.end(); } catch {}
  }
}

