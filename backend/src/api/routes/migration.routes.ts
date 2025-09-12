/**
 * Migration API Routes
 * LocalStorageデータをデータベースに移行するためのAPIエンドポイント
 */

import { Router, Request, Response } from 'express';
import migrationService from '../../services/migration-service';
import { logger } from '../../config/logger';

const router = Router();

/**
 * POST /api/migration/import
 * LocalStorageデータをインポート
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { profiles, schedules, uploadHistory } = req.body;

    if (!profiles && !schedules && !uploadHistory) {
      return res.status(400).json({
        error: 'No data provided for migration'
      });
    }

    // データベースのバックアップを作成
    await migrationService.backupDatabase();

    // 移行実行
    const result = await migrationService.migrateFromLocalStorage({
      profiles,
      schedules,
      uploadHistory
    });

    if (result.success) {
      // 重複データのクリーンアップ
      await migrationService.cleanupDuplicates();

      res.json({
        success: true,
        message: 'Data migrated successfully',
        migrated: result.migrated
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.message
      });
    }
  } catch (error: any) {
    logger.error('Migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/migration/status
 * 移行状態を確認
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await migrationService.getMigrationStatus();
    
    res.json({
      success: true,
      status,
      message: 'Current database record counts'
    });
  } catch (error: any) {
    logger.error('Failed to get migration status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/migration/backup
 * データベースのバックアップを作成
 */
router.post('/backup', async (req: Request, res: Response) => {
  try {
    await migrationService.backupDatabase();
    
    res.json({
      success: true,
      message: 'Database backup created successfully'
    });
  } catch (error: any) {
    logger.error('Failed to create backup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/migration/cleanup
 * 重複データのクリーンアップ
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    await migrationService.cleanupDuplicates();
    
    res.json({
      success: true,
      message: 'Duplicate records cleaned up successfully'
    });
  } catch (error: any) {
    logger.error('Failed to cleanup duplicates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;