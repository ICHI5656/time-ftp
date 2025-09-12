import * as cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { db } from '../db/database';
import { logger } from '../config/logger';

export class RetentionService {
  private static instance: RetentionService;
  private dailyJob: cron.ScheduledTask | null = null;

  static getInstance(): RetentionService {
    if (!RetentionService.instance) {
      RetentionService.instance = new RetentionService();
    }
    return RetentionService.instance;
  }

  private getRetentionDays(): number {
    const n = Number(process.env.RETENTION_DAYS || 60);
    if (Number.isNaN(n) || n < 1) return 60;
    return Math.min(n, 365); // guardrail
  }

  async initialize(): Promise<void> {
    // Run startup cleanup for DB-based items (completed/failed tasks etc.)
    await this.runStartupCleanup();

    // Schedule daily cleanup for files + DB (03:30 Asia/Tokyo by default)
    const tz = process.env.TZ || 'Asia/Tokyo';
    this.dailyJob = cron.schedule('30 3 * * *', async () => {
      try {
        await this.cleanupDbHistory();
        await this.cleanupFileQueue();
        await this.cleanupServerFiles();
        logger.info('[Retention] Daily cleanup completed');
      } catch (e: any) {
        logger.error('[Retention] Daily cleanup failed:', e);
      }
    }, { scheduled: true, timezone: tz });

    logger.info('[Retention] Service initialized');
  }

  async shutdown(): Promise<void> {
    try { this.dailyJob?.stop(); } catch {}
    this.dailyJob = null;
    logger.info('[Retention] Service stopped');
  }

  private async runStartupCleanup(): Promise<void> {
    try {
      await this.cleanupDbHistory();
      await this.cleanupFileQueue();
      // File cleanup is run daily; skip heavy IO at boot if desired
      if (process.env.RETENTION_CLEAN_FILES_ON_BOOT === '1') {
        await this.cleanupServerFiles();
      }
      logger.info('[Retention] Startup cleanup completed');
    } catch (e: any) {
      logger.error('[Retention] Startup cleanup failed:', e);
    }
  }

  private async cleanupDbHistory(): Promise<void> {
    const days = this.getRetentionDays();
    // Purge upload_history older than N days for completed/failed tasks
    const stmt1 = db.prepare(`DELETE FROM upload_history WHERE created_at < datetime('now', ?)`);
    const delta = `-${days} days`;
    const result1 = stmt1.run(delta);
    logger.info(`[Retention] upload_history purged: ${result1.changes} rows (< ${days}d)`);
  }

  private async cleanupFileQueue(): Promise<void> {
    const days = this.getRetentionDays();
    // Remove file_queue entries older than N days (any status). Stale pending items are likely abandoned.
    const stmt = db.prepare(`DELETE FROM file_queue WHERE created_at < datetime('now', ?)`);
    const res = stmt.run(`-${days} days`);
    logger.info(`[Retention] file_queue purged: ${res.changes} rows (< ${days}d)`);
  }

  private async cleanupServerFiles(): Promise<void> {
    const days = this.getRetentionDays();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const roots = [
      path.join(__dirname, '../../../data/uploads'),
      path.join(__dirname, '../../../data/processed'),
    ];
    for (const root of roots) {
      try {
        if (!fs.existsSync(root)) continue;
        const entries = fs.readdirSync(root);
        let removed = 0;
        for (const name of entries) {
          const p = path.join(root, name);
          try {
            const stat = fs.statSync(p);
            const mtime = stat.mtimeMs || stat.mtime.getTime();
            if (mtime < cutoff) {
              if (stat.isDirectory()) {
                // Best-effort recursive removal for nested processed subdirs
                this.rmdirRecursiveSafe(p);
              } else {
                fs.unlinkSync(p);
              }
              removed++;
            }
          } catch {}
        }
        if (removed > 0) logger.info(`[Retention] Removed ${removed} old items from ${root} (< ${days}d)`);
      } catch (e: any) {
        logger.warn(`[Retention] Failed to scan ${root}: ${e?.message || e}`);
      }
    }
  }

  private rmdirRecursiveSafe(dir: string) {
    try {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir)) {
        const p = path.join(dir, entry);
        const s = fs.statSync(p);
        if (s.isDirectory()) this.rmdirRecursiveSafe(p); else fs.unlinkSync(p);
      }
      fs.rmdirSync(dir);
    } catch {}
  }
}

