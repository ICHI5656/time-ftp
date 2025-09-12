import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { body, validationResult } from 'express-validator';
import { logger } from '../../config/logger';
import { SchedulerService } from '../../services/scheduler-service';
import { Schedule } from '../../types';
import * as cron from 'node-cron';
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

// Create new schedule with file upload (FormData)
const upload = multer({
  dest: path.join(__dirname, '../../../data/temp-uploads'),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

router.post('/with-file', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const {
      profile_id,
      name,
      upload_directory,
      schedule_type,
      schedule_time
    } = req.body;

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'ファイルが必要です' });
    }

    if (!profile_id || !name || !upload_directory) {
      return res.status(400).json({ error: '必須フィールドが不足しています' });
    }

    // Convert schedule_type to cron expression
    let cronExpression = '0 0 * * *'; // default: daily at midnight
    if (schedule_type === 'hourly') cronExpression = '0 * * * *';
    else if (schedule_type === 'daily') cronExpression = '0 0 * * *';
    else if (schedule_type === 'weekly') cronExpression = '0 0 * * 0';
    else if (schedule_type === 'monthly') cronExpression = '0 0 1 * *';

    // If specific time provided, update cron expression
    if (schedule_time) {
      const [hours, minutes] = schedule_time.split(':');
      if (schedule_type === 'daily') {
        cronExpression = `${minutes || 0} ${hours || 0} * * *`;
      }
    }

    const scheduleData = {
      name,
      ftp_connection_id: parseInt(profile_id),
      source_directory: '.',
      target_directory: upload_directory,
      cron_expression: cronExpression,
      file_pattern: '*.csv',
      selected_files: [file.filename],
      is_active: true
    };

    const scheduleId = createSchedule(scheduleData);
    
    // Start the schedule
    await schedulerService.createSchedule({
      id: scheduleId,
      ...scheduleData
    });

    logger.info(`Schedule created with file upload: ${scheduleId}`);

    res.json({
      success: true,
      message: 'スケジュールが作成されました',
      scheduleId,
      fileName: file.originalname
    });

  } catch (error: any) {
    logger.error('Failed to create schedule with file:', error);
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
    body('selected_files').optional({ nullable: true }).isArray()
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
      // Validate cron expression before inserting
      if (!cron.validate(req.body.cron_expression)) {
        return res.status(400).json({
          error: '無効なCron式です。例: 毎日9時なら "0 9 * * *"',
          code: 'INVALID_CRON_EXPRESSION'
        });
      }
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
      
      // Start the schedule (if active and valid)
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

// Create multiple schedules in batch (support multiple servers and per-server combinations)
router.post('/batch',
  [
    body('name').notEmpty().withMessage('スケジュール名が必要です'),
    body('cron_expression').notEmpty().withMessage('Cron式が必要です'),
    body('source_directory').optional().isString(),
    body('target_directory').optional().isString(),
    // Two mutually exclusive input shapes:
    // 1) { ftp_connection_ids: number[], selected_files?: string[], file_pattern?: string }
    // 2) { combinations: Array<{ ftp_connection_id: number, selected_files?: string[], target_directory?: string }> }
    body('ftp_connection_ids').optional({ nullable: true }).isArray(),
    body('combinations').optional({ nullable: true }).isArray(),
    body('selected_files').optional({ nullable: true }).isArray(),
    body('file_pattern').optional({ nullable: true }).isString()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, cron_expression } = req.body;

      // Validate cron
      if (!cron.validate(cron_expression)) {
        return res.status(400).json({
          error: '無効なCron式です。例: 毎日9時なら "0 9 * * *"',
          code: 'INVALID_CRON_EXPRESSION'
        });
      }

      const created: Schedule[] = [] as any;

      if (Array.isArray(req.body.ftp_connection_ids) && req.body.ftp_connection_ids.length > 0) {
        // Same payload for multiple servers
        for (const ftpId of req.body.ftp_connection_ids) {
          const ftpConn = getFtpConnection(ftpId);
          if (!ftpConn) {
            return res.status(400).json({ 
              error: `FTP接続が見つかりません (id=${ftpId})`,
              code: 'FTP_CONNECTION_NOT_FOUND'
            });
          }
          const scheduleData: any = {
            name,
            ftp_connection_id: ftpId,
            source_directory: req.body.source_directory ?? '.',
            target_directory: req.body.target_directory ?? '/',
            cron_expression,
            file_pattern: req.body.file_pattern ?? null,
            selected_files: req.body.selected_files ? JSON.stringify(req.body.selected_files) : null,
            is_active: 1
          };
          const id = createSchedule(scheduleData);
          const schedule = getSchedule(Number(id)) as Schedule;
          if (schedule && schedule.selected_files && typeof schedule.selected_files === 'string') {
            schedule.selected_files = JSON.parse(schedule.selected_files);
          }
          await schedulerService.createSchedule(schedule);
          created.push(schedule);
        }
      } else if (Array.isArray(req.body.combinations) && req.body.combinations.length > 0) {
        // Per-server combinations
        for (const combo of req.body.combinations) {
          const ftpId = combo.ftp_connection_id;
          const ftpConn = getFtpConnection(ftpId);
          if (!ftpConn) {
            return res.status(400).json({ 
              error: `FTP接続が見つかりません (id=${ftpId})`,
              code: 'FTP_CONNECTION_NOT_FOUND'
            });
          }
          const scheduleData: any = {
            name,
            ftp_connection_id: ftpId,
            source_directory: req.body.source_directory ?? '.',
            target_directory: combo.target_directory ?? req.body.target_directory ?? '/',
            cron_expression,
            file_pattern: req.body.file_pattern ?? null,
            selected_files: Array.isArray(combo.selected_files) ? JSON.stringify(combo.selected_files) : (req.body.selected_files ? JSON.stringify(req.body.selected_files) : null),
            is_active: 1
          };
          const id = createSchedule(scheduleData);
          const schedule = getSchedule(Number(id)) as Schedule;
          if (schedule && schedule.selected_files && typeof schedule.selected_files === 'string') {
            schedule.selected_files = JSON.parse(schedule.selected_files);
          }
          await schedulerService.createSchedule(schedule);
          created.push(schedule);
        }
      } else {
        return res.status(400).json({
          error: 'ftp_connection_ids または combinations のいずれかを指定してください',
          code: 'INVALID_BATCH_PAYLOAD'
        });
      }

      res.status(201).json({ count: created.length, schedules: created });
    } catch (error: any) {
      logger.error('Failed to create batch schedules:', error);
      res.status(500).json({ error: error.message });
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
    body('file_pattern').optional({ nullable: true }).isString(),
    body('selected_files').optional({ nullable: true }).isArray(),
    body('is_active').optional().isBoolean()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const id = parseFloat(req.params.id); // フロートIDに対応
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
    const id = parseFloat(req.params.id); // フロートIDに対応
    const schedule = getSchedule(id);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Stop the schedule
    await schedulerService.stopSchedule(id);

    // First, update related upload_history records to null schedule_id or delete them
    const updateHistoryStmt = db.prepare('UPDATE upload_history SET schedule_id = NULL WHERE schedule_id = ?');
    updateHistoryStmt.run(id);

    // Then delete the schedule
    const stmt = db.prepare('DELETE FROM upload_schedules WHERE id = ?');
    stmt.run(id);

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error: any) {
    logger.error('Failed to delete schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Execute schedule immediately
router.post('/:id/execute', async (req: Request, res: Response) => {
  try {
    const id = parseFloat(req.params.id);
    const schedule = getSchedule(id) as any;
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Execute the schedule immediately
    schedulerService.triggerSchedule(id).then(() => {
      logger.info(`Schedule ${id} executed successfully`);
    }).catch((error) => {
      logger.error(`Failed to execute schedule ${id}:`, error);
    });

    res.json({ 
      message: 'Schedule execution started',
      scheduleId: id,
      scheduleName: schedule?.name,
      note: 'Processing in background'
    });
  } catch (error: any) {
    logger.error('Failed to execute schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trigger schedule manually
router.post('/:id/trigger', async (req: Request, res: Response) => {
  try {
    const id = parseFloat(req.params.id); // フロートIDに対応
    const schedule = getSchedule(id) as any;
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
      scheduleId: id,
      scheduleName: schedule?.name,
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

// Debug endpoint to check schedule configuration
router.get('/debug/:id', async (req: Request, res: Response) => {
  try {
    const scheduleId = parseInt(req.params.id);
    const schedule = getSchedule(scheduleId);
    const allSchedules = getAllSchedules();
    
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../../../data/uploads');
    
    res.json({
      schedule,
      allSchedules: allSchedules.length,
      uploadsExists: fs.existsSync(uploadsDir),
      uploadsFiles: fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : []
    });
  } catch (error: any) {
    logger.error('Failed to debug schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as scheduleRoutes };
