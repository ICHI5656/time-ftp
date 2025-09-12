import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { logger } from '../../config/logger';
import { db } from '../../db/database';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../data/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Allow common text/data types (CSV, XML, TXT, HTML, ZIP)
    const allowedExt = ['.csv', '.xml', '.txt', '.zip', '.html', '.htm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExt.includes(ext)) return cb(null, true);
    // Fallback by mimetype
    const okTypes = [
      'text/csv', 'text/plain', 'application/zip', 'application/x-zip-compressed',
      'text/html', 'application/xml', 'text/xml'
    ];
    if (okTypes.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only CSV, XML, TXT, HTML, ZIP files are allowed'));
  },
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Upload single CSV file
router.post('/csv', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      message: 'File uploaded successfully',
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        path: req.file.path
      }
    });
  } catch (error: any) {
    logger.error('Failed to upload file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload multiple CSV files
router.post('/csv/multiple', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      path: file.path
    }));

    res.json({
      message: `${uploadedFiles.length} files uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error: any) {
    logger.error('Failed to upload files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get upload history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string;

    let query = `
      SELECT h.*, s.name as schedule_name, f.name as ftp_name 
      FROM upload_history h
      LEFT JOIN upload_schedules s ON h.schedule_id = s.id
      LEFT JOIN ftp_connections f ON h.ftp_connection_id = f.id
    `;

    const params: any[] = [];
    if (status) {
      query += ' WHERE h.upload_status = ?';
      params.push(status);
    }

    query += ' ORDER BY h.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const history = stmt.all(...params);

    res.json(history);
  } catch (error: any) {
    logger.error('Failed to get upload history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get upload statistics
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_uploads,
        SUM(CASE WHEN upload_status = 'success' THEN 1 ELSE 0 END) as successful_uploads,
        SUM(CASE WHEN upload_status = 'failed' THEN 1 ELSE 0 END) as failed_uploads,
        SUM(file_size) as total_bytes_uploaded,
        AVG(duration_ms) as avg_upload_duration_ms
      FROM upload_history
      WHERE created_at >= datetime('now', '-60 days')
    `).get();

    const recentUploads = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM upload_history
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).all();

    res.json({
      summary: stats,
      recentUploads
    });
  } catch (error: any) {
    logger.error('Failed to get upload statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get file queue
router.get('/queue', async (req: Request, res: Response) => {
  try {
    const scheduleId = req.query.schedule_id as string;
    const status = req.query.status as string || 'pending';

    let query = 'SELECT * FROM file_queue';
    const params: any[] = [];
    const conditions: string[] = [];

    if (scheduleId) {
      conditions.push('schedule_id = ?');
      params.push(scheduleId);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY upload_order ASC';

    const stmt = db.prepare(query);
    const queue = stmt.all(...params);

    res.json(queue);
  } catch (error: any) {
    logger.error('Failed to get file queue:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear file queue
router.delete('/queue/:scheduleId', async (req: Request, res: Response) => {
  try {
    const scheduleId = parseInt(req.params.scheduleId);
    const stmt = db.prepare('DELETE FROM file_queue WHERE schedule_id = ? AND status = "pending"');
    const result = stmt.run(scheduleId);

    res.json({
      message: 'Queue cleared successfully',
      deletedCount: result.changes
    });
  } catch (error: any) {
    logger.error('Failed to clear file queue:', error);
    res.status(500).json({ error: error.message });
  }
});

// List uploaded files
router.get('/files', async (req: Request, res: Response) => {
  try {
    const uploadDir = path.join(__dirname, '../../../data/uploads');
    
    if (!fs.existsSync(uploadDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(uploadDir)
      .filter(file => file.endsWith('.csv'))
      .map(file => {
        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.modified.getTime() - a.modified.getTime());

    res.json(files);
  } catch (error: any) {
    logger.error('Failed to list uploaded files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete uploaded file
router.delete('/files/:filename', async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../../data/uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    fs.unlinkSync(filePath);

    res.json({ message: 'File deleted successfully' });
  } catch (error: any) {
    logger.error('Failed to delete file:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as uploadRoutes };
