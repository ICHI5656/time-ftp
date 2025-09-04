import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initDatabase } from './db/database';
import { logger } from './config/logger';
import { ftpRoutes } from './api/routes/ftp.routes';
import { scheduleRoutes } from './api/routes/schedule.routes';
import { uploadRoutes } from './api/routes/upload.routes';
import { SchedulerService } from './services/scheduler-service';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// 500MB対応のため、JSONとURLエンコードのサイズ制限を増やす
app.use(express.json({ limit: '550mb' }));
app.use(express.urlencoded({ extended: true, limit: '550mb' }));

// Static files for uploaded CSVs
app.use('/uploads', express.static(path.join(__dirname, '../../data/uploads')));

// API Routes
app.use('/api/ftp', ftpRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/uploads', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize services and start server
const startServer = async () => {
  try {
    // Initialize database
    await initDatabase();
    logger.info('Database initialized successfully');

    // Initialize scheduler service
    const schedulerService = SchedulerService.getInstance();
    await schedulerService.initialize();
    logger.info('Scheduler service initialized');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received. Closing server...');
  const scheduler = SchedulerService.getInstance();
  await scheduler.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received. Closing server...');
  const scheduler = SchedulerService.getInstance();
  await scheduler.shutdown();
  process.exit(0);
});