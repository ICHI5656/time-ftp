// Type definitions for the application

export interface Schedule {
  id?: number;
  name: string;
  ftp_connection_id: number;
  source_directory: string;
  target_directory: string;
  cron_expression: string;
  file_pattern?: string | null;
  selected_files?: string | string[] | null;
  is_active?: boolean;
  last_run?: Date | null;
  next_run?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface FTPConnection {
  id?: number;
  name: string;
  host: string;
  port?: number;
  user: string;
  password: string;
  secure?: boolean;
  default_directory?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface FileQueue {
  id?: number;
  filename: string;
  source_path: string;
  target_path: string;
  schedule_id?: number | null;
  priority?: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string | null;
  attempts?: number;
  created_at?: Date;
  processed_at?: Date | null;
}

export interface UploadHistory {
  id?: number;
  filename: string;
  source_path: string;
  target_path: string;
  ftp_connection_id: number;
  schedule_id?: number | null;
  status: 'success' | 'failed';
  error_message?: string | null;
  file_size?: number | null;
  upload_duration?: number | null;
  created_at?: Date;
}