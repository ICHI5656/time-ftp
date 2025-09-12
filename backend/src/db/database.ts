import Database from 'better-sqlite3';
import path from 'path';
import { logger } from '../config/logger';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../../data/database.db');
export const db = new Database(dbPath);

export const initDatabase = async () => {
  try {
    // Enable foreign keys
    db.exec('PRAGMA foreign_keys = ON');

    // Create FTP connections table
    db.exec(`
      CREATE TABLE IF NOT EXISTS ftp_connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        host TEXT NOT NULL,
        port INTEGER DEFAULT 21,
        user TEXT NOT NULL,
        password TEXT NOT NULL,
        secure BOOLEAN DEFAULT 0,
        protocol TEXT DEFAULT 'ftp',
        default_directory TEXT DEFAULT '/',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create upload schedules table
    db.exec(`
      CREATE TABLE IF NOT EXISTS upload_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        ftp_connection_id INTEGER NOT NULL,
        source_directory TEXT NOT NULL,
        target_directory TEXT NOT NULL,
        cron_expression TEXT NOT NULL,
        file_pattern TEXT DEFAULT '*.csv',
        selected_files TEXT,
        is_active BOOLEAN DEFAULT 1,
        last_run DATETIME,
        next_run DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ftp_connection_id) REFERENCES ftp_connections (id) ON DELETE CASCADE
      )
    `);
    
    // Add selected_files column if it doesn't exist (for migration)
    try {
      db.exec(`ALTER TABLE upload_schedules ADD COLUMN selected_files TEXT`);
    } catch (error) {
      // Column already exists, ignore
    }

    // Add protocol column to ftp_connections if it doesn't exist (migration)
    try {
      db.exec(`ALTER TABLE ftp_connections ADD COLUMN protocol TEXT DEFAULT 'ftp'`);
    } catch (error) {
      // Column already exists, ignore
    }

    // Fix upload_history table constraint (migration) - make schedule_id nullable
    try {
      // Check if we need to recreate the table
      const tableInfo = db.prepare("PRAGMA table_info(upload_history)").all() as any[];
      const scheduleIdColumn = tableInfo.find(col => col.name === 'schedule_id');
      
      if (scheduleIdColumn && scheduleIdColumn.notnull === 1) {
        // Need to recreate table with nullable schedule_id
        db.exec(`
          BEGIN TRANSACTION;
          CREATE TABLE upload_history_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            schedule_id INTEGER,
            ftp_connection_id INTEGER NOT NULL,
            file_name TEXT NOT NULL,
            file_size INTEGER,
            source_path TEXT,
            target_path TEXT,
            upload_status TEXT NOT NULL,
            error_message TEXT,
            retry_count INTEGER DEFAULT 0,
            started_at DATETIME,
            completed_at DATETIME,
            duration_ms INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (schedule_id) REFERENCES upload_schedules (id) ON DELETE SET NULL,
            FOREIGN KEY (ftp_connection_id) REFERENCES ftp_connections (id) ON DELETE CASCADE
          );
          INSERT INTO upload_history_new SELECT * FROM upload_history;
          DROP TABLE upload_history;
          ALTER TABLE upload_history_new RENAME TO upload_history;
          COMMIT;
        `);
      }
    } catch (error) {
      // Migration failed or not needed, continue
      console.log('Upload history table migration skipped:', error);
    }

    // Create file queue table
    db.exec(`
      CREATE TABLE IF NOT EXISTS file_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER,
        upload_order INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        scheduled_at DATETIME,
        FOREIGN KEY (schedule_id) REFERENCES upload_schedules (id) ON DELETE CASCADE
      )
    `);

    // Create upload history table
    db.exec(`
      CREATE TABLE IF NOT EXISTS upload_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id INTEGER,
        ftp_connection_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER,
        source_path TEXT,
        target_path TEXT,
        upload_status TEXT NOT NULL,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        started_at DATETIME,
        completed_at DATETIME,
        duration_ms INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schedule_id) REFERENCES upload_schedules (id) ON DELETE SET NULL,
        FOREIGN KEY (ftp_connection_id) REFERENCES ftp_connections (id) ON DELETE SET NULL
      )
    `);

    // Create indexes for better performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_file_queue_status ON file_queue(status);
      CREATE INDEX IF NOT EXISTS idx_file_queue_schedule ON file_queue(schedule_id);
      CREATE INDEX IF NOT EXISTS idx_upload_history_schedule ON upload_history(schedule_id);
      CREATE INDEX IF NOT EXISTS idx_upload_history_status ON upload_history(upload_status);
      CREATE INDEX IF NOT EXISTS idx_upload_history_created ON upload_history(created_at);
    `);

    logger.info('Database tables created successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
};

// Helper functions for database operations
export const getFtpConnection = (id: number) => {
  const stmt = db.prepare('SELECT * FROM ftp_connections WHERE id = ?');
  return stmt.get(id);
};

export const getAllFtpConnections = () => {
  const stmt = db.prepare('SELECT * FROM ftp_connections WHERE is_active = 1');
  return stmt.all();
};

export const createFtpConnection = (data: any) => {
  const stmt = db.prepare(`
    INSERT INTO ftp_connections (name, host, port, user, password, secure, protocol, default_directory)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name,
    data.host,
    data.port || 21,
    data.user,
    data.password,
    data.secure ? 1 : 0,  // Convert boolean to integer
    data.protocol && typeof data.protocol === 'string' ? data.protocol : (data.secure ? 'ftps' : 'ftp'),
    data.default_directory || '/'
  );
  return result.lastInsertRowid;
};

export const getSchedule = (id: number) => {
  const stmt = db.prepare('SELECT * FROM upload_schedules WHERE id = ?');
  return stmt.get(id);
};

export const getAllSchedules = () => {
  const stmt = db.prepare(`
    SELECT s.*, f.name as ftp_name, f.host as ftp_host 
    FROM upload_schedules s 
    LEFT JOIN ftp_connections f ON s.ftp_connection_id = f.id 
    WHERE s.is_active = 1
  `);
  return stmt.all();
};

export const createSchedule = (data: any) => {
  const stmt = db.prepare(`
    INSERT INTO upload_schedules (name, ftp_connection_id, source_directory, target_directory, cron_expression, file_pattern, selected_files)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name,
    data.ftp_connection_id,
    data.source_directory,
    data.target_directory,
    data.cron_expression,
    data.file_pattern || '*.csv',
    data.selected_files || null
  );
  return result.lastInsertRowid;
};

export const addToFileQueue = (scheduleId: number, filePath: string, fileName: string, order: number) => {
  const stmt = db.prepare(`
    INSERT INTO file_queue (schedule_id, file_path, file_name, upload_order, status)
    VALUES (?, ?, ?, ?, 'pending')
  `);
  return stmt.run(scheduleId, filePath, fileName, order);
};

export const getNextQueuedFile = (scheduleId: number) => {
  const stmt = db.prepare(`
    SELECT * FROM file_queue 
    WHERE schedule_id = ? AND status = 'pending' 
    ORDER BY upload_order ASC 
    LIMIT 1
  `);
  return stmt.get(scheduleId);
};

export const updateFileQueueStatus = (id: number, status: string, errorMessage?: string) => {
  const stmt = db.prepare(`
    UPDATE file_queue 
    SET status = ?, error_message = ?
    WHERE id = ?
  `);
  return stmt.run(status, errorMessage || null, id);
};

export const addUploadHistory = (data: any) => {
  const stmt = db.prepare(`
    INSERT INTO upload_history (
      schedule_id, ftp_connection_id, file_name, file_size,
      source_path, target_path, upload_status, error_message,
      retry_count, started_at, completed_at, duration_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    data.schedule_id,
    data.ftp_connection_id,
    data.file_name,
    data.file_size,
    data.source_path,
    data.target_path,
    data.upload_status,
    data.error_message,
    data.retry_count,
    data.started_at,
    data.completed_at,
    data.duration_ms
  );
};
