// SQLiteデータベース管理
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// データベースディレクトリを作成
const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// データベース接続
const db = new Database(path.join(dbDir, 'ftp-manager.db'));

// スキーマ定義と初期化
function initializeDatabase() {
    console.log('📊 SQLiteデータベースを初期化中...');
    
    // サーバープロファイルテーブル
    db.exec(`
        CREATE TABLE IF NOT EXISTS server_profiles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            host TEXT NOT NULL,
            port INTEGER NOT NULL,
            username TEXT,
            password TEXT,
            protocol TEXT DEFAULT 'ftp',
            default_directory TEXT DEFAULT '/',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1
        )
    `);
    
    // スケジュールテーブル
    db.exec(`
        CREATE TABLE IF NOT EXISTS schedules (
            id TEXT PRIMARY KEY,
            profile_id TEXT NOT NULL,
            name TEXT NOT NULL,
            file_path TEXT,
            temp_file_path TEXT,
            upload_directory TEXT DEFAULT '/',
            schedule_type TEXT DEFAULT 'once',
            schedule_time DATETIME,
            status TEXT DEFAULT 'pending',
            last_run DATETIME,
            next_run DATETIME,
            retry_count INTEGER DEFAULT 0,
            error_message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (profile_id) REFERENCES server_profiles(id)
        )
    `);
    
    // アップロード履歴テーブル
    db.exec(`
        CREATE TABLE IF NOT EXISTS upload_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            profile_id TEXT NOT NULL,
            schedule_id TEXT,
            file_name TEXT NOT NULL,
            file_size INTEGER,
            upload_path TEXT,
            status TEXT NOT NULL,
            error_message TEXT,
            duration_ms INTEGER,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (profile_id) REFERENCES server_profiles(id),
            FOREIGN KEY (schedule_id) REFERENCES schedules(id)
        )
    `);
    
    // セッション管理テーブル
    db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            profile_id TEXT,
            data TEXT,
            expires_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (profile_id) REFERENCES server_profiles(id)
        )
    `);
    
    // インデックスの作成
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_schedules_profile ON schedules(profile_id);
        CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);
        CREATE INDEX IF NOT EXISTS idx_history_profile ON upload_history(profile_id);
        CREATE INDEX IF NOT EXISTS idx_history_date ON upload_history(uploaded_at);
    `);
    
    console.log('✅ データベースの初期化完了');
}

// プロファイル操作
class ProfileManager {
    static getAll() {
        return db.prepare('SELECT * FROM server_profiles WHERE is_active = 1 ORDER BY name').all();
    }
    
    static getById(id) {
        return db.prepare('SELECT * FROM server_profiles WHERE id = ?').get(id);
    }
    
    static create(profile) {
        const stmt = db.prepare(`
            INSERT INTO server_profiles (id, name, host, port, username, password, protocol, default_directory)
            VALUES (@id, @name, @host, @port, @username, @password, @protocol, @default_directory)
        `);
        
        profile.id = profile.id || `profile_${Date.now()}`;
        return stmt.run(profile);
    }
    
    static update(id, updates) {
        const fields = Object.keys(updates).map(key => `${key} = @${key}`).join(', ');
        const stmt = db.prepare(`
            UPDATE server_profiles 
            SET ${fields}, updated_at = CURRENT_TIMESTAMP
            WHERE id = @id
        `);
        return stmt.run({ ...updates, id });
    }
    
    static delete(id) {
        // 論理削除
        return db.prepare('UPDATE server_profiles SET is_active = 0 WHERE id = ?').run(id);
    }
    
    static validateConnection(profile) {
        // 接続テストのログを記録
        const stmt = db.prepare(`
            INSERT INTO upload_history (profile_id, file_name, status, error_message)
            VALUES (?, 'CONNECTION_TEST', ?, ?)
        `);
        return stmt;
    }
}

// スケジュール操作
class ScheduleManager {
    static getAll() {
        return db.prepare(`
            SELECT s.*, p.name as profile_name, p.host, p.protocol
            FROM schedules s
            JOIN server_profiles p ON s.profile_id = p.id
            WHERE p.is_active = 1
            ORDER BY s.created_at DESC
        `).all();
    }
    
    static getPending() {
        return db.prepare(`
            SELECT s.*, p.name as profile_name, p.host, p.port, p.username, p.password, p.protocol
            FROM schedules s
            JOIN server_profiles p ON s.profile_id = p.id
            WHERE s.status = 'pending' AND p.is_active = 1
            AND (s.schedule_time IS NULL OR s.schedule_time <= datetime('now'))
            ORDER BY s.schedule_time
        `).all();
    }
    
    static create(schedule) {
        const stmt = db.prepare(`
            INSERT INTO schedules (id, profile_id, name, file_path, temp_file_path, upload_directory, schedule_type, schedule_time, status)
            VALUES (@id, @profile_id, @name, @file_path, @temp_file_path, @upload_directory, @schedule_type, @schedule_time, @status)
        `);
        
        schedule.id = schedule.id || `schedule_${Date.now()}`;
        schedule.status = schedule.status || 'pending';
        return stmt.run(schedule);
    }
    
    static updateStatus(id, status, errorMessage = null) {
        const stmt = db.prepare(`
            UPDATE schedules 
            SET status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP,
                last_run = CASE WHEN ? IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE last_run END
            WHERE id = ?
        `);
        return stmt.run(status, errorMessage, status, id);
    }
    
    static delete(id) {
        return db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
    }
}

// アップロード履歴操作
class HistoryManager {
    static getRecent(limit = 100) {
        return db.prepare(`
            SELECT h.*, p.name as profile_name, p.host
            FROM upload_history h
            JOIN server_profiles p ON h.profile_id = p.id
            ORDER BY h.uploaded_at DESC
            LIMIT ?
        `).all(limit);
    }
    
    static create(entry) {
        const stmt = db.prepare(`
            INSERT INTO upload_history (profile_id, schedule_id, file_name, file_size, upload_path, status, error_message, duration_ms)
            VALUES (@profile_id, @schedule_id, @file_name, @file_size, @upload_path, @status, @error_message, @duration_ms)
        `);
        return stmt.run(entry);
    }
    
    static getStats() {
        return db.prepare(`
            SELECT 
                COUNT(*) as total_uploads,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_uploads,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_uploads,
                SUM(file_size) as total_size,
                AVG(duration_ms) as avg_duration
            FROM upload_history
            WHERE uploaded_at >= datetime('now', '-30 days')
        `).get();
    }
    
    static cleanup(daysToKeep = 60) {
        return db.prepare(`
            DELETE FROM upload_history 
            WHERE uploaded_at < datetime('now', '-' || ? || ' days')
        `).run(daysToKeep);
    }
}

// セッション管理
class SessionManager {
    static get(id) {
        const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > datetime("now")').get(id);
        if (session && session.data) {
            session.data = JSON.parse(session.data);
        }
        return session;
    }
    
    static set(id, profileId, data, expiresInMinutes = 30) {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO sessions (id, profile_id, data, expires_at)
            VALUES (?, ?, ?, datetime('now', '+' || ? || ' minutes'))
        `);
        return stmt.run(id, profileId, JSON.stringify(data), expiresInMinutes);
    }
    
    static cleanup() {
        return db.prepare('DELETE FROM sessions WHERE expires_at < datetime("now")').run();
    }
}

// データベース初期化
initializeDatabase();

// 定期クリーンアップ（1日1回）
setInterval(() => {
    console.log('🧹 データベースクリーンアップ実行中...');
    HistoryManager.cleanup(60);
    SessionManager.cleanup();
}, 24 * 60 * 60 * 1000);

module.exports = {
    db,
    ProfileManager,
    ScheduleManager,
    HistoryManager,
    SessionManager
};