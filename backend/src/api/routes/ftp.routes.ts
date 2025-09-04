import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '../../config/logger';
import { FtpService } from '../../services/ftp-service';
import {
  getAllFtpConnections,
  getFtpConnection,
  createFtpConnection,
  db
} from '../../db/database';

const router = Router();

// Get all FTP connections
router.get('/', async (req: Request, res: Response) => {
  try {
    const connections = getAllFtpConnections();
    res.json(connections);
  } catch (error: any) {
    logger.error('Failed to get FTP connections:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single FTP connection
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const connection = getFtpConnection(parseInt(req.params.id));
    if (!connection) {
      return res.status(404).json({ error: 'FTP connection not found' });
    }
    res.json(connection);
  } catch (error: any) {
    logger.error('Failed to get FTP connection:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new FTP connection
router.post('/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('host').notEmpty().withMessage('Host is required'),
    body('user').notEmpty().withMessage('User is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('port').optional().isInt({ min: 1, max: 65535 }),
    body('secure').optional().isBoolean(),
    body('default_directory').optional().isString()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const id = createFtpConnection(req.body);
      const connection = getFtpConnection(Number(id));
      res.status(201).json(connection);
    } catch (error: any) {
      logger.error('Failed to create FTP connection:', error);
      if (error.message.includes('UNIQUE')) {
        res.status(400).json({ error: 'Connection name already exists' });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
);

// Update FTP connection
router.put('/:id',
  [
    body('name').optional().notEmpty(),
    body('host').optional().notEmpty(),
    body('user').optional().notEmpty(),
    body('password').optional().notEmpty(),
    body('port').optional().isInt({ min: 1, max: 65535 }),
    body('secure').optional().isBoolean(),
    body('default_directory').optional().isString()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const id = parseInt(req.params.id);
      const connection = getFtpConnection(id);
      if (!connection) {
        return res.status(404).json({ error: 'FTP connection not found' });
      }

      const updates = Object.entries(req.body)
        .map(([key, value]) => `${key} = ?`)
        .join(', ');
      const values = Object.values(req.body);
      values.push(id);

      const stmt = db.prepare(`
        UPDATE ftp_connections 
        SET ${updates}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      stmt.run(...values);

      const updatedConnection = getFtpConnection(id);
      res.json(updatedConnection);
    } catch (error: any) {
      logger.error('Failed to update FTP connection:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete FTP connection
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const connection = getFtpConnection(id);
    if (!connection) {
      return res.status(404).json({ error: 'FTP connection not found' });
    }

    const stmt = db.prepare('DELETE FROM ftp_connections WHERE id = ?');
    stmt.run(id);

    res.json({ message: 'FTP connection deleted successfully' });
  } catch (error: any) {
    logger.error('Failed to delete FTP connection:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test FTP connection
router.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const connection = getFtpConnection(id);
    if (!connection) {
      return res.status(404).json({ error: 'FTP connection not found' });
    }

    const ftpService = new FtpService();
    await ftpService.connect(id);
    const result = await ftpService.testConnection();
    await ftpService.disconnect();

    res.json({ 
      success: result,
      message: result ? 'Connection successful' : 'Connection failed'
    });
  } catch (error: any) {
    logger.error('FTP connection test failed:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// List FTP directory contents
router.get('/:id/list', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const directory = req.query.directory as string || '/';
    
    const connection = getFtpConnection(id);
    if (!connection) {
      return res.status(404).json({ error: 'FTP connection not found' });
    }

    const ftpService = new FtpService();
    await ftpService.connect(id);
    const files = await ftpService.listFiles(directory);
    await ftpService.disconnect();

    res.json(files);
  } catch (error: any) {
    logger.error('Failed to list FTP directory:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as ftpRoutes };