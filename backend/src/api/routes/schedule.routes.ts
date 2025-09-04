import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '../../config/logger';
import { SchedulerService } from '../../services/scheduler-service';
import {
  getAllSchedules,
  getSchedule,
  createSchedule,
  db
} from '../../db/database';

const router = Router();
const schedulerService = SchedulerService.getInstance();

// Get all schedules
router.get('/', async (req: Request, res: Response) => {
  try {
    const schedules = getAllSchedules();
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
    body('name').notEmpty().withMessage('Name is required'),
    body('ftp_connection_id').isInt().withMessage('FTP connection ID is required'),
    body('source_directory').notEmpty().withMessage('Source directory is required'),
    body('target_directory').notEmpty().withMessage('Target directory is required'),
    body('cron_expression').notEmpty().withMessage('Cron expression is required'),
    body('file_pattern').optional().isString()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const id = createSchedule(req.body);
      const schedule = getSchedule(Number(id));
      
      // Start the schedule
      await schedulerService.createSchedule(schedule);
      
      res.status(201).json(schedule);
    } catch (error: any) {
      logger.error('Failed to create schedule:', error);
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
    body('file_pattern').optional().isString(),
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

      const updates = Object.entries(req.body)
        .map(([key, value]) => `${key} = ?`)
        .join(', ');
      const values = Object.values(req.body);
      values.push(id);

      const stmt = db.prepare(`
        UPDATE upload_schedules 
        SET ${updates}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      stmt.run(...values);

      const updatedSchedule = getSchedule(id);
      
      // Update the running schedule
      await schedulerService.updateSchedule(id, updatedSchedule);
      
      res.json(updatedSchedule);
    } catch (error: any) {
      logger.error('Failed to update schedule:', error);
      res.status(500).json({ error: error.message });
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