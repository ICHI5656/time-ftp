import nodemailer from 'nodemailer';
import { logger } from '../config/logger';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface UploadNotificationData {
  fileName: string;
  server: string;
  targetPath: string;
  scheduledTime: Date;
  executedTime: Date;
  status: 'success' | 'failed';
  errorMessage?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  initialize(config: EmailConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
    
    logger.info('Email service initialized', {
      host: config.host,
      port: config.port,
      user: config.auth.user
    });
  }

  async sendUploadNotification(to: string, data: UploadNotificationData): Promise<boolean> {
    if (!this.transporter || !this.config) {
      logger.error('Email service not initialized');
      return false;
    }

    try {
      const subject = `【楽天FTP Manager】${data.status === 'success' ? '予約アップロード完了' : 'アップロード失敗'}: ${data.fileName}`;
      
      const html = this.generateUploadNotificationHtml(data);
      const text = this.generateUploadNotificationText(data);

      const mailOptions = {
        from: this.config.auth.user,
        to: to,
        subject: subject,
        text: text,
        html: html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Upload notification email sent', {
        to: to,
        fileName: data.fileName,
        status: data.status,
        messageId: result.messageId
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to send upload notification email', {
        error: error.message,
        to: to,
        fileName: data.fileName
      });
      return false;
    }
  }

  private generateUploadNotificationHtml(data: UploadNotificationData): string {
    const statusIcon = data.status === 'success' ? '✅' : '❌';
    const statusText = data.status === 'success' ? '成功' : '失敗';
    const statusColor = data.status === 'success' ? '#28a745' : '#dc3545';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>楽天FTP Manager - アップロード通知</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #bf0000, #ff3333); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">${statusIcon} 楽天FTP Manager</h1>
        <p style="margin: 5px 0 0 0; font-size: 16px;">予約アップロード通知</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef;">
        <h2 style="color: ${statusColor}; margin-top: 0;">アップロード${statusText}</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px; font-weight: bold; background: #e9ecef; width: 30%;">ファイル名</td>
                <td style="padding: 8px; background: white;">${data.fileName}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold; background: #e9ecef;">サーバー</td>
                <td style="padding: 8px; background: white;">${data.server}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold; background: #e9ecef;">アップロード先</td>
                <td style="padding: 8px; background: white;">${data.targetPath}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold; background: #e9ecef;">予約時刻</td>
                <td style="padding: 8px; background: white;">${data.scheduledTime.toLocaleString('ja-JP')}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold; background: #e9ecef;">実行時刻</td>
                <td style="padding: 8px; background: white;">${data.executedTime.toLocaleString('ja-JP')}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold; background: #e9ecef;">ステータス</td>
                <td style="padding: 8px; background: white; color: ${statusColor}; font-weight: bold;">${statusText}</td>
            </tr>
            ${data.errorMessage ? `
            <tr>
                <td style="padding: 8px; font-weight: bold; background: #e9ecef;">エラー詳細</td>
                <td style="padding: 8px; background: #fff3cd; color: #856404;">${data.errorMessage}</td>
            </tr>
            ` : ''}
        </table>
    </div>
    
    <div style="background: #6c757d; color: white; padding: 10px; border-radius: 0 0 8px 8px; font-size: 14px; text-align: center;">
        このメールは楽天FTP Managerから自動送信されています
    </div>
</body>
</html>
    `;
  }

  private generateUploadNotificationText(data: UploadNotificationData): string {
    const statusText = data.status === 'success' ? '成功' : '失敗';
    
    return `
楽天FTP Manager - 予約アップロード通知

アップロード${statusText}

ファイル名: ${data.fileName}
サーバー: ${data.server}
アップロード先: ${data.targetPath}
予約時刻: ${data.scheduledTime.toLocaleString('ja-JP')}
実行時刻: ${data.executedTime.toLocaleString('ja-JP')}
ステータス: ${statusText}
${data.errorMessage ? `エラー詳細: ${data.errorMessage}` : ''}

このメールは楽天FTP Managerから自動送信されています。
    `;
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Email connection test successful');
      return true;
    } catch (error: any) {
      logger.error('Email connection test failed', { error: error.message });
      return false;
    }
  }
}

export const emailService = new EmailService();