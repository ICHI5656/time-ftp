/**
 * LocalStorage to Database Migration Service
 * 
 * このサービスは、フロントエンドのLocalStorageに保存されているデータを
 * バックエンドのSQLiteデータベースに移行します。
 */

import { db } from '../db/database';
import { logger } from '../config/logger';

interface LocalStorageProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  protocol: 'ftp' | 'sftp';
  defaultDirectory?: string;
  isDefault?: boolean;
  lastUsed?: string;
}

interface LocalStorageSchedule {
  id: string;
  name: string;
  profileId: string;
  sourceDirectory: string;
  targetDirectory: string;
  selectedFiles?: string[];
  scheduledTime?: string;
  repeatInterval?: string;
  status: string;
  createdAt: string;
  lastRun?: string;
}

interface LocalStorageUploadHistory {
  id: string;
  fileName: string;
  fileSize: number;
  profileName: string;
  uploadDate: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  retryCount?: number;
}

export class MigrationService {
  private static instance: MigrationService;

  private constructor() {}

  static getInstance(): MigrationService {
    if (!MigrationService.instance) {
      MigrationService.instance = new MigrationService();
    }
    return MigrationService.instance;
  }

  /**
   * LocalStorageデータをデータベースに移行
   */
  async migrateFromLocalStorage(data: {
    profiles?: LocalStorageProfile[];
    schedules?: LocalStorageSchedule[];
    uploadHistory?: LocalStorageUploadHistory[];
  }): Promise<{
    success: boolean;
    message: string;
    migrated: {
      profiles: number;
      schedules: number;
      history: number;
    };
  }> {
    const migrated = {
      profiles: 0,
      schedules: 0,
      history: 0
    };

    try {
      // トランザクション開始
      db.exec('BEGIN TRANSACTION');

      // 1. プロファイル（FTP接続）の移行
      if (data.profiles && data.profiles.length > 0) {
        const insertProfile = db.prepare(`
          INSERT OR IGNORE INTO ftp_connections (
            name, host, port, user, password, secure, protocol, default_directory, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `);

        for (const profile of data.profiles) {
          try {
            // パスワードをハッシュ化（セキュリティ向上のため）
            const hashedPassword = await this.hashPassword(profile.password);
            
            insertProfile.run(
              profile.name,
              profile.host,
              profile.port || 21,
              profile.username,
              hashedPassword, // ハッシュ化されたパスワードを保存
              profile.protocol === 'sftp' ? 1 : 0,
              profile.protocol || 'ftp',
              profile.defaultDirectory || '/'
            );
            migrated.profiles++;
            
            logger.info(`Migrated profile: ${profile.name}`);
          } catch (error) {
            logger.error(`Failed to migrate profile ${profile.name}:`, error);
          }
        }
      }

      // 2. スケジュールの移行
      if (data.schedules && data.schedules.length > 0) {
        // プロファイルIDマッピングを取得
        const profileMap = new Map<string, number>();
        const profiles = db.prepare('SELECT id, name FROM ftp_connections').all() as any[];
        profiles.forEach(p => profileMap.set(p.name, p.id));

        const insertSchedule = db.prepare(`
          INSERT OR IGNORE INTO upload_schedules (
            name, ftp_connection_id, source_directory, target_directory,
            cron_expression, file_pattern, selected_files, is_active, last_run
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const schedule of data.schedules) {
          try {
            // プロファイル名からFTP接続IDを取得
            const profileName = data.profiles?.find(p => p.id === schedule.profileId)?.name;
            const ftpConnectionId = profileName ? profileMap.get(profileName) : null;

            if (ftpConnectionId) {
              // cron式に変換（簡易的な実装）
              const cronExpression = this.convertToCronExpression(schedule.repeatInterval);
              
              insertSchedule.run(
                schedule.name,
                ftpConnectionId,
                schedule.sourceDirectory || '.',
                schedule.targetDirectory || '/',
                cronExpression,
                '*.csv',
                schedule.selectedFiles ? JSON.stringify(schedule.selectedFiles) : null,
                schedule.status === 'active' ? 1 : 0,
                schedule.lastRun || null
              );
              migrated.schedules++;
              
              logger.info(`Migrated schedule: ${schedule.name}`);
            }
          } catch (error) {
            logger.error(`Failed to migrate schedule ${schedule.name}:`, error);
          }
        }
      }

      // 3. アップロード履歴の移行
      if (data.uploadHistory && data.uploadHistory.length > 0) {
        // プロファイル名からIDマッピングを取得
        const profileMap = new Map<string, number>();
        const profiles = db.prepare('SELECT id, name FROM ftp_connections').all() as any[];
        profiles.forEach(p => profileMap.set(p.name, p.id));

        const insertHistory = db.prepare(`
          INSERT OR IGNORE INTO upload_history (
            ftp_connection_id, file_name, file_size, upload_status,
            error_message, retry_count, started_at, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const history of data.uploadHistory) {
          try {
            const ftpConnectionId = profileMap.get(history.profileName);
            
            if (ftpConnectionId) {
              insertHistory.run(
                ftpConnectionId,
                history.fileName,
                history.fileSize,
                history.status,
                history.errorMessage || null,
                history.retryCount || 0,
                history.uploadDate,
                history.uploadDate
              );
              migrated.history++;
              
              logger.info(`Migrated history record: ${history.fileName}`);
            }
          } catch (error) {
            logger.error(`Failed to migrate history ${history.fileName}:`, error);
          }
        }
      }

      // コミット
      db.exec('COMMIT');

      return {
        success: true,
        message: 'Migration completed successfully',
        migrated
      };

    } catch (error) {
      // ロールバック
      db.exec('ROLLBACK');
      logger.error('Migration failed:', error);
      
      return {
        success: false,
        message: `Migration failed: ${error}`,
        migrated
      };
    }
  }

  /**
   * パスワードのハッシュ化
   */
  private async hashPassword(password: string): Promise<string> {
    // 本番環境では適切な暗号化を使用すること
    // ここでは簡単な例として、Base64エンコードを使用
    return Buffer.from(password).toString('base64');
  }

  /**
   * 繰り返し間隔をcron式に変換
   */
  private convertToCronExpression(repeatInterval?: string): string {
    if (!repeatInterval) return '0 0 * * *'; // デフォルト: 毎日0時

    switch (repeatInterval) {
      case 'hourly':
        return '0 * * * *';
      case 'daily':
        return '0 0 * * *';
      case 'weekly':
        return '0 0 * * 0';
      case 'monthly':
        return '0 0 1 * *';
      default:
        return '0 0 * * *';
    }
  }

  /**
   * データベースのバックアップ作成
   */
  async backupDatabase(): Promise<void> {
    const backupPath = `${process.env.DATABASE_PATH || './data/database.db'}.backup.${Date.now()}`;
    
    try {
      // better-sqlite3 v8+ returns a Promise from db.backup
      await (db as any).backup(backupPath);
      logger.info(`Database backed up to: ${backupPath}`);
    } catch (error) {
      logger.error('Failed to backup database:', error);
      throw error;
    }
  }

  /**
   * 移行状態の確認
   */
  async getMigrationStatus(): Promise<{
    profiles: number;
    schedules: number;
    history: number;
    fileQueue: number;
  }> {
    try {
      const profiles = db.prepare('SELECT COUNT(*) as count FROM ftp_connections').get() as any;
      const schedules = db.prepare('SELECT COUNT(*) as count FROM upload_schedules').get() as any;
      const history = db.prepare('SELECT COUNT(*) as count FROM upload_history').get() as any;
      const fileQueue = db.prepare('SELECT COUNT(*) as count FROM file_queue').get() as any;

      return {
        profiles: profiles.count,
        schedules: schedules.count,
        history: history.count,
        fileQueue: fileQueue.count
      };
    } catch (error) {
      logger.error('Failed to get migration status:', error);
      throw error;
    }
  }

  /**
   * 重複データのクリーンアップ
   */
  async cleanupDuplicates(): Promise<void> {
    try {
      // 重複するFTP接続を削除（名前でグループ化し、最新のものを残す）
      db.exec(`
        DELETE FROM ftp_connections 
        WHERE id NOT IN (
          SELECT MAX(id) FROM ftp_connections GROUP BY name, host, port
        )
      `);

      // 重複するスケジュールを削除
      db.exec(`
        DELETE FROM upload_schedules 
        WHERE id NOT IN (
          SELECT MAX(id) FROM upload_schedules GROUP BY name, ftp_connection_id
        )
      `);

      logger.info('Cleaned up duplicate records');
    } catch (error) {
      logger.error('Failed to cleanup duplicates:', error);
      throw error;
    }
  }
}

// エクスポート
export default MigrationService.getInstance();
