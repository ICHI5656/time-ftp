import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '../../config/logger';
import { SchedulerService } from '../../services/scheduler-service';
import { Schedule } from '../../types';
import {
  getAllSchedules,
  getSchedule,
  createSchedule,
  getFtpConnection,
  db
} from '../../db/database';

const router = Router();
const schedulerService = SchedulerService.getInstance();

// Get all schedules
router.get('/', async (req: Request, res: Response) => {
  try {
    const schedules = getAllSchedules() as Schedule[];
    // JSON文字列をパースして配列に戻す
    schedules.forEach((schedule: Schedule) => {
      if (schedule.selected_files && typeof schedule.selected_files === 'string') {
        try {
          schedule.selected_files = JSON.parse(schedule.selected_files);
        } catch (e) {
          schedule.selected_files = null;
        }
      }
    });
    res.json(schedules);
  } catch (error: any) {
    logger.error('Failed to get schedules:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single schedule
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const schedule = getSchedule(parseInt(req.params.id));
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    res.json(schedule);
  } catch (error: any) {
    logger.error('Failed to get schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new schedule
router.post('/',
  [
    body('name').notEmpty().withMessage('スケジュール名が必要です'),
    body('ftp_connection_id').isInt({ min: 1 }).withMessage('有効なFTP接続IDが必要です'),
    body('source_directory').notEmpty().withMessage('ソースディレクトリが必要です'),
    body('target_directory').notEmpty().withMessage('ターゲットディレクトリが必要です'),
    body('cron_expression').notEmpty().withMessage('Cron式が必要です'),
    body('file_pattern').optional({ nullable: true }).isString(),
    body('selected_files').optional().isArray()
  ],
  async (req: Request, res: Response) => {
    logger.info('=== DEBUG: Schedule creation request ===');
    logger.info('Request body:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // FTP接続の存在確認
      const ftpConnection = getFtpConnection(req.body.ftp_connection_id);
      if (!ftpConnection) {
        return res.status(400).json({ 
          error: '指定されたFTP接続が見つかりません。有効なFTP接続を選択してください。',
          code: 'FTP_CONNECTION_NOT_FOUND'
        });
      }

      // selected_filesが配列の場合はJSON文字列に変換
      const scheduleData = { ...req.body };
      if (scheduleData.selected_files) {
        scheduleData.selected_files = JSON.stringify(scheduleData.selected_files);
      }
      
      const id = createSchedule(scheduleData);
      const schedule = getSchedule(Number(id)) as Schedule;
      
      // JSON文字列をパースして配列に戻す
      if (schedule && schedule.selected_files && typeof schedule.selected_files === 'string') {
        schedule.selected_files = JSON.parse(schedule.selected_files);
      }
      
      // Start the schedule
      await schedulerService.createSchedule(schedule);
      
      res.status(201).json(schedule);
    } catch (error: any) {
      logger.error('Failed to create schedule:', error);
      
      if (error.message.includes('FOREIGN KEY constraint failed')) {
        res.status(400).json({ 
          error: 'FTP接続が無効です。有効なFTP接続を選択してください。',
          code: 'FOREIGN_KEY_CONSTRAINT_FAILED'
        });
      } else if (error.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ 
          error: 'この名前のスケジュールは既に存在します。別の名前を使用してください。',
          code: 'DUPLICATE_SCHEDULE_NAME'
        });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
);

// Update schedule
router.put('/:id',
  [
    body('name').optional().notEmpty(),
    body('ftp_connection_id').optional().isInt(),
    body('source_directory').optional().notEmpty(),
    body('target_directory').optional().notEmpty(),
    body('cron_expression').optional().notEmpty(),
    body('file_pattern').optional().isString(),
    body('selected_files').optional().isArray(),
    body('is_active').optional().isBoolean()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const id = parseInt(req.params.id);
      const schedule = getSchedule(id);
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      // FTP接続の存在確認（更新時にftp_connection_idが指定された場合）
      if (req.body.ftp_connection_id) {
        const ftpConnection = getFtpConnection(req.body.ftp_connection_id);
        if (!ftpConnection) {
          return res.status(400).json({ 
            error: '指定されたFTP接続が見つかりません。有効なFTP接続を選択してください。',
            code: 'FTP_CONNECTION_NOT_FOUND'
          });
        }
      }

      // selected_filesが配列の場合はJSON文字列に変換
      const updateData = { ...req.body };
      if (updateData.selected_files) {
        updateData.selected_files = JSON.stringify(updateData.selected_files);
      }

      const updates = Object.entries(updateData)
        .map(([key, value]) => `${key} = ?`)
        .join(', ');
      const values = Object.values(updateData);
      values.push(id);

      const stmt = db.prepare(`
        UPDATE upload_schedules 
        SET ${updates}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      stmt.run(...values);

      const updatedSchedule = getSchedule(id) as Schedule;
      
      // JSON文字列をパースして配列に戻す
      if (updatedSchedule && updatedSchedule.selected_files && typeof updatedSchedule.selected_files === 'string') {
        updatedSchedule.selected_files = JSON.parse(updatedSchedule.selected_files);
      }
      
      // Update the running schedule
      await schedulerService.updateSchedule(id, updatedSchedule);
      
      res.json(updatedSchedule);
    } catch (error: any) {
      logger.error('Failed to update schedule:', error);
      
      if (error.message.includes('FOREIGN KEY constraint failed')) {
        res.status(400).json({ 
          error: 'FTP接続が無効です。有効なFTP接続を選択してください。',
          code: 'FOREIGN_KEY_CONSTRAINT_FAILED'
        });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
);

// Delete schedule
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const schedule = getSchedule(id);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Stop the schedule
    await schedulerService.stopSchedule(id);

    const stmt = db.prepare('DELETE FROM upload_schedules WHERE id = ?');
    stmt.run(id);

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error: any) {
    logger.error('Failed to delete schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trigger schedule manually
router.post('/:id/trigger', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const schedule = getSchedule(id);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Trigger the schedule
    schedulerService.triggerSchedule(id).then(() => {
      logger.info(`Schedule ${id} triggered successfully`);
    }).catch((error) => {
      logger.error(`Failed to trigger schedule ${id}:`, error);
    });

    res.json({ 
      message: 'Schedule triggered successfully',
      note: 'Processing in background'
    });
  } catch (error: any) {
    logger.error('Failed to trigger schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get active schedules (running in memory)
router.get('/status/active', async (req: Request, res: Response) => {
  try {
    const activeSchedules = schedulerService.getActiveSchedules();
    res.json(activeSchedules);
  } catch (error: any) {
    logger.error('Failed to get active schedules:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as scheduleRoutes };