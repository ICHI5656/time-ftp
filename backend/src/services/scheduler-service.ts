import * as cron from 'node-cron';
import path from 'path';
import fs from 'fs';
import { logger } from '../config/logger';
import { FtpConnectionPool } from './ftp-service';
import { 
  getAllSchedules, 
  getNextQueuedFile, 
  updateFileQueueStatus,
  addToFileQueue,
  db
} from '../db/database';

interface ScheduleTask {
  id: number;
  name: string;
  cronJob: cron.ScheduledTask;
}

export class SchedulerService {
  private static instance: SchedulerService;
  private scheduledTasks: Map<number, ScheduleTask> = new Map();
  private ftpPool: FtpConnectionPool;

  private constructor() {
    this.ftpPool = FtpConnectionPool.getInstance();
  }

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Load all active schedules from database
      const schedules = getAllSchedules() as any[];
      
      for (const schedule of schedules) {
        await this.createSchedule(schedule);
      }
      
      logger.info(`Initialized ${schedules.length} schedules`);
    } catch (error) {
      logger.error('Failed to initialize scheduler service:', error);
      throw error;
    }
  }

  async createSchedule(schedule: any): Promise<void> {
    try {
      // Respect is_active flag; do not schedule inactive entries
      if (schedule.is_active === 0 || schedule.is_active === false) {
        logger.info(`Skipping inactive schedule: ${schedule.name}`);
        return;
      }
      // Validate cron expression
      if (!cron.validate(schedule.cron_expression)) {
        logger.error(`Invalid cron expression for schedule ${schedule.name}: ${schedule.cron_expression}`);
        return;
      }

      // Create cron job
      const task = cron.schedule(schedule.cron_expression, async () => {
        await this.executeSchedule(schedule);
      }, {
        scheduled: true,
        timezone: process.env.TZ || 'Asia/Tokyo'
      });

      // Store task reference
      this.scheduledTasks.set(schedule.id, {
        id: schedule.id,
        name: schedule.name,
        cronJob: task
      });

      logger.info(`Created schedule: ${schedule.name} (${schedule.cron_expression})`);
    } catch (error) {
      logger.error(`Failed to create schedule ${schedule.name}:`, error);
    }
  }

  async executeSchedule(schedule: any): Promise<void> {
    logger.info(`Executing schedule: ${schedule.name}`);
    
    try {
      // Get FTP connection
      const ftpService = await this.ftpPool.getConnection(schedule.ftp_connection_id);
      
      // Get CSV files from source directory  
      const baseDir = path.join(__dirname, '../../../data/uploads');
      const sourceDir = schedule.source_directory === '.' || !schedule.source_directory ? baseDir : path.join(baseDir, schedule.source_directory);
      
      logger.info(`FIXED Debug - Base directory: ${baseDir}, Source directory setting: "${schedule.source_directory}", Final sourceDir: ${sourceDir}`);
      // If specific files were selected, honor that list (may be JSON string in DB)
      let files: string[] = [];
      let selectedFiles: string[] | undefined;
      if (schedule.selected_files) {
        if (Array.isArray(schedule.selected_files)) {
          selectedFiles = schedule.selected_files as string[];
        } else if (typeof schedule.selected_files === 'string') {
          try {
            selectedFiles = JSON.parse(schedule.selected_files);
          } catch {
            selectedFiles = undefined;
          }
        }
      }

      // デバッグ用ログを追加
      logger.info(`Debug - Schedule ${schedule.name}:`, {
        sourceDir,
        selectedFiles: selectedFiles || 'undefined',
        selectedFilesLength: selectedFiles?.length || 0
      });

      if (selectedFiles && selectedFiles.length > 0) {
        // Keep user-specified order; build absolute paths
        const potentialFiles = selectedFiles.map((name: string) => {
          const fullPath = path.join(sourceDir, name);
          const exists = fs.existsSync(fullPath);
          logger.info(`Debug - File check: ${fullPath} exists: ${exists}`);
          return fullPath;
        });
        files = potentialFiles.filter((full) => fs.existsSync(full));
      } else {
        files = await this.getCSVFiles(sourceDir, schedule.file_pattern || '*.csv');
        logger.info(`Debug - Found CSV files:`, files);
      }
      
      if (files.length === 0) {
        logger.info(`No files found for schedule ${schedule.name}`, {
          sourceDir,
          selectedFiles,
          scheduleData: JSON.stringify(schedule, null, 2)
        });
        return;
      }

      // Add files to queue
      for (let i = 0; i < files.length; i++) {
        await addToFileQueue(
          schedule.id,
          files[i],
          path.basename(files[i]),
          i + 1
        );
      }

      // Process queue sequentially
      await this.processFileQueue(schedule, ftpService);

      // Update last run time
      const stmt = db.prepare('UPDATE upload_schedules SET last_run = CURRENT_TIMESTAMP WHERE id = ?');
      stmt.run(schedule.id);

      // If this schedule targets explicitly selected files (one-time), deactivate after first run
      const isOneTime = (!schedule.file_pattern || schedule.file_pattern === null) && !!schedule.selected_files;
      if (isOneTime) {
        const deactivateStmt = db.prepare('UPDATE upload_schedules SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        deactivateStmt.run(schedule.id);
        // Also stop the in-memory cron job
        await this.stopSchedule(schedule.id);
        logger.info(`Deactivated one-time schedule: ${schedule.name}`);
      }

      logger.info(`Completed schedule: ${schedule.name}`);
    } catch (error) {
      logger.error(`Failed to execute schedule ${schedule.name}:`, error);
    }
  }

  async processFileQueue(schedule: any, ftpService: any): Promise<void> {
    let nextFile = getNextQueuedFile(schedule.id) as any;
    
    while (nextFile) {
      try {
        // Build remote path
        const remotePath = path.join(
          schedule.target_directory,
          nextFile.file_name
        );

        // Upload file
        await ftpService.uploadFile(
          nextFile.file_path,
          remotePath,
          schedule.id
        );

        // Mark as completed
        await updateFileQueueStatus(nextFile.id, 'completed');

        // Move file to processed directory
        const processedDir = path.join(__dirname, '../../../data/processed', schedule.source_directory);
        if (!fs.existsSync(processedDir)) {
          fs.mkdirSync(processedDir, { recursive: true });
        }
        
        const processedPath = path.join(processedDir, `${Date.now()}_${nextFile.file_name}`);
        fs.renameSync(nextFile.file_path, processedPath);

        logger.info(`Uploaded and moved: ${nextFile.file_name}`);
      } catch (error: any) {
        logger.error(`Failed to upload ${nextFile.file_name}:`, error);
        
        // Update status with error
        await updateFileQueueStatus(nextFile.id, 'failed', error.message);
        
        // Implement retry logic
        const retryCount = nextFile.retry_count || 0;
        const maxRetries = parseInt(process.env.FTP_DEFAULT_RETRY_COUNT || '3');
        
        if (retryCount < maxRetries) {
          // Update retry count and re-queue
          const stmt = db.prepare('UPDATE file_queue SET retry_count = retry_count + 1, status = "pending" WHERE id = ?');
          stmt.run(nextFile.id);
          logger.info(`Queued for retry (${retryCount + 1}/${maxRetries}): ${nextFile.file_name}`);
        }
      }
      
      // Get next file
      nextFile = getNextQueuedFile(schedule.id) as any;
    }
  }

  async getCSVFiles(directory: string, pattern: string): Promise<string[]> {
    try {
      if (!fs.existsSync(directory)) {
        logger.warn(`Directory does not exist: ${directory}`);
        return [];
      }

      const files = fs.readdirSync(directory);
      const csvFiles = files
        .filter(file => {
          // Simple pattern matching (supports *.csv)
          if (pattern === '*.csv') {
            return file.endsWith('.csv');
          }
          return file.match(new RegExp(pattern.replace('*', '.*')));
        })
        .map(file => path.join(directory, file))
        .sort(); // Sort files for consistent ordering

      return csvFiles;
    } catch (error) {
      logger.error(`Failed to get CSV files from ${directory}:`, error);
      return [];
    }
  }

  async updateSchedule(scheduleId: number, schedule: any): Promise<void> {
    // Stop existing schedule
    await this.stopSchedule(scheduleId);

    // Only (re)create if active
    if (schedule.is_active === 0 || schedule.is_active === false) {
      logger.info(`Schedule ${scheduleId} updated to inactive; not rescheduling.`);
      return;
    }

    // Create new schedule
    await this.createSchedule({ ...schedule, id: scheduleId });
  }

  async stopSchedule(scheduleId: number): Promise<void> {
    const task = this.scheduledTasks.get(scheduleId);
    if (task) {
      task.cronJob.stop();
      this.scheduledTasks.delete(scheduleId);
      logger.info(`Stopped schedule: ${task.name}`);
    }
  }

  async stopAllSchedules(): Promise<void> {
    for (const [id, task] of this.scheduledTasks) {
      task.cronJob.stop();
    }
    this.scheduledTasks.clear();
    logger.info('Stopped all schedules');
  }

  async shutdown(): Promise<void> {
    await this.stopAllSchedules();
    await this.ftpPool.closeAllConnections();
    logger.info('Scheduler service shut down');
  }

  getActiveSchedules(): Array<{ id: number; name: string; running: boolean }> {
    const schedules = [];
    for (const [id, task] of this.scheduledTasks) {
      schedules.push({
        id: task.id,
        name: task.name,
        running: true // cronJobは起動済み
      });
    }
    return schedules;
  }

  // Manual trigger for testing
  async triggerSchedule(scheduleId: number): Promise<void> {
    const schedule = db.prepare('SELECT * FROM upload_schedules WHERE id = ?').get(scheduleId);
    if (schedule) {
      await this.executeSchedule(schedule);
    } else {
      throw new Error(`Schedule ${scheduleId} not found`);
    }
  }
}
