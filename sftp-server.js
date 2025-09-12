const express = require('express');
const path = require('path');
const fs = require('fs');
const Client = require('ssh2-sftp-client');
const FTPClient = require('basic-ftp').Client;
const multer = require('multer');
const bodyParser = require('body-parser');
const iconv = require('iconv-lite');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8091;

// CORS設定
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Preflightリクエストへの対応
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

// Middleware with increased limits
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(__dirname));

// Ensure data directory for lightweight persistence
const DATA_DIR = path.join(__dirname, 'data');
const TEMP_FILES_DIR = path.join(__dirname, 'data', 'temp-files');
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(TEMP_FILES_DIR)) {
        fs.mkdirSync(TEMP_FILES_DIR, { recursive: true });
    }
}
function readJson(file, fallback) {
    try {
        ensureDataDir();
        if (!fs.existsSync(file)) return fallback;
        const txt = fs.readFileSync(file, 'utf8');
        return JSON.parse(txt);
    } catch (e) {
        return fallback;
    }
}
function writeJson(file, data) {
    ensureDataDir();
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// Configure multer for file uploads with encoding support
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'test-uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // ファイル名のエンコーディングを適切に処理
        let originalName = file.originalname;
        try {
            // multerはlatin1として受け取るので、バッファに戻してUTF-8として解釈
            const buffer = Buffer.from(originalName, 'latin1');
            originalName = buffer.toString('utf8');
        } catch (e) {
            console.error('ファイル名変換エラー:', e);
        }
        
        // 日本語ファイル名の場合は安全な名前に変換
        const timestamp = Date.now();
        const ext = path.extname(originalName);
        const basename = path.basename(originalName, ext);
        
        // 日本語が含まれている場合は別名を使用
        if (/[^\x00-\x7F]/.test(basename)) {
            const safeBasename = 'file_' + timestamp;
            console.log(`日本語ファイル名を変換: ${originalName} → ${safeBasename}${ext}`);
            cb(null, safeBasename + ext);
        } else {
            cb(null, timestamp + '-' + originalName);
        }
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB制限（TSサーバーと統一）
        fieldSize: 10 * 1024 * 1024  // フィールドサイズ10MB
    }
});

// Serve the main HTML page
app.get('/', (req, res) => {
    // Try index.html first, then fallback to other HTML files
    const indexPath = path.join(__dirname, 'index.html');
    const altPath = path.join(__dirname, 'ultimate-ftp-manager-linked.html');
    const oldPath = path.join(__dirname, 'sftp-test.html');
    
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else if (fs.existsSync(altPath)) {
        res.sendFile(altPath);
    } else if (fs.existsSync(oldPath)) {
        res.sendFile(oldPath);
    } else {
        res.status(404).send('No HTML file found');
    }
});

// SFTP configuration from environment or request
function getSftpConfig(body = {}) {
    return {
        host: body.host || process.env.FTP_HOST || 'upload.rakuten.ne.jp',
        port: parseInt(body.port) || parseInt(process.env.FTP_PORT) || 22,
        username: body.username || process.env.FTP_USER || 'amicoco',
        password: body.password || process.env.FTP_PASSWORD,
        readyTimeout: 20000,
        retries: 3,
        retry_factor: 2,
        retry_minTimeout: 2000
    };
}

// FTP configuration from environment or request
function getFtpConfig(body = {}) {
    return {
        host: body.host || process.env.FTP_HOST || 'ftp.example.com',
        port: parseInt(body.port) || parseInt(process.env.FTP_PORT) || 21,
        user: body.username || process.env.FTP_USER || 'anonymous',
        password: body.password || process.env.FTP_PASSWORD || 'anonymous@',
        secure: body.secure === true || body.secure === 'true',
        secureOptions: body.secure ? { rejectUnauthorized: false } : undefined,
        connTimeout: 30000,  // 30秒のタイムアウト
        pasvTimeout: 30000,  // パッシブモードのタイムアウト
        keepalive: 10000     // キープアライブ
    };
}

// Test connection (SFTP or FTP)
app.post('/api/test-connection', async (req, res) => {
    const protocol = req.body.protocol || 'sftp';
    
    // デバッグ：受信したデータの詳細をログ出力
    console.log('受信した接続データ:', {
        hasHost: !!req.body.host,
        hasUsername: !!req.body.username,
        hasPassword: !!req.body.password,
        passwordType: typeof req.body.password,
        passwordLength: req.body.password ? req.body.password.length : 0,
        rawBody: req.body
    });

    // パスワードチェック（より詳細な検証）
    if (!req.body.password || req.body.password.trim() === '') {
        console.log('パスワードエラー - 詳細:', {
            password: req.body.password,
            type: typeof req.body.password,
            trimmed: req.body.password ? req.body.password.trim() : 'undefined'
        });
        return res.status(400).json({
            success: false,
            message: 'パスワードが入力されていません',
            error: 'Password is required',
            details: {
                host: req.body.host,
                port: req.body.port,
                username: req.body.username,
                protocol: protocol
            }
        });
    }
    
    if (protocol === 'ftp') {
        // FTP接続テスト
        const config = getFtpConfig(req.body);
        const ftp = new FTPClient();
        
        try {
            console.log('Testing FTP connection:', {
                host: config.host,
                port: config.port,
                user: config.user,
                secure: config.secure,
                hasPassword: !!config.password
            });
            
            await ftp.access(config);
            
            // Get directory listing
            const list = await ftp.list('/');
            
            res.json({
                success: true,
                message: 'FTP接続成功！',
                details: {
                    host: config.host,
                    port: config.port,
                    username: config.user,
                    protocol: 'ftp',
                    secure: config.secure,
                    fileCount: list.length,
                    files: list.slice(0, 10).map(item => ({
                        name: item.name,
                        type: item.isDirectory ? 'directory' : 'file',
                        size: item.size
                    }))
                }
            });
        } catch (error) {
            console.error('FTP connection error:', error.message);
            
            let errorMessage = 'FTP接続失敗';
            let errorDetail = error.message;
            
            if (error.message.includes('Login') || error.message.includes('530')) {
                errorMessage = '認証失敗';
                errorDetail = 'ユーザー名またはパスワードが正しくありません';
            } else if (error.message.includes('ECONNREFUSED')) {
                errorMessage = '接続拒否';
                errorDetail = 'サーバーが応答していません';
            } else if (error.message.includes('ETIMEDOUT')) {
                errorMessage = 'タイムアウト';
                errorDetail = 'サーバーへの接続がタイムアウトしました';
            }
            
            res.status(200).json({
                success: false,
                message: errorMessage,
                error: errorDetail,
                details: {
                    host: config.host,
                    port: config.port,
                    username: config.user,
                    protocol: 'ftp'
                }
            });
        } finally {
            ftp.close();
        }
    } else {
        // SFTP接続テスト
        const config = getSftpConfig(req.body);
        const sftp = new Client();
        
        try {
            console.log('Testing SFTP connection:', {
                host: config.host,
                port: config.port,
                username: config.username,
                hasPassword: !!config.password
            });
            
            // タイムアウト付きでSFTP接続 (5秒)
            const connectPromise = sftp.connect(config);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('ETIMEDOUT: Connection timeout after 5 seconds')), 5000);
            });
            
            console.log('🔄 SFTP接続を開始...');
            await Promise.race([connectPromise, timeoutPromise]);
            console.log('✅ SFTP接続成功！');
            
            // ホームディレクトリ（実カレント）を解決して一覧取得
            console.log('📂 ディレクトリ情報を取得中...');
            let baseDir = '/';
            try {
                baseDir = await sftp.realPath('.') || '/';
                console.log('📁 ベースディレクトリ:', baseDir);
            } catch (err) {
                console.log('⚠️ realPath失敗:', err.message);
            }
            
            let list = [];
            try {
                console.log('📋 ファイル一覧を取得中...');
                list = await sftp.list(baseDir);
                console.log('📄 ファイル数:', list.length);
            } catch (e) {
                console.log('⚠️ list失敗:', e.message, '- カレントディレクトリで再試行');
                // 権限でルート一覧が拒否される場合は '.' を試す
                try { list = await sftp.list('.'); } catch (_) {}
            }
            
            const responseData = {
                success: true,
                message: 'SFTP接続成功！',
                details: {
                    host: config.host,
                    port: config.port,
                    username: config.username,
                    protocol: 'sftp',
                    baseDir,
                    fileCount: list.length,
                    files: list.slice(0, 10).map(item => ({
                        name: item.name,
                        type: item.type === 'd' ? 'directory' : 'file',
                        size: item.size
                    }))
                }
            };
            
            console.log('📤 レスポンス送信中...', {
                success: responseData.success,
                fileCount: responseData.details.fileCount,
                baseDir: responseData.details.baseDir
            });
            
            res.json(responseData);
            console.log('✅ レスポンス送信完了！');
        } catch (error) {
            console.error('SFTP connection error:', error.message);
            
            let errorMessage = 'SFTP接続失敗';
            let errorDetail = error.message;
            
            if (error.message.includes('authentication methods failed')) {
                errorMessage = '認証失敗';
                errorDetail = 'ユーザー名またはパスワードが正しくありません';
            } else if (error.message.includes('ECONNREFUSED')) {
                errorMessage = '接続拒否';
                errorDetail = 'サーバーが応答していません';
            } else if (error.message.includes('ETIMEDOUT')) {
                errorMessage = 'タイムアウト';
                errorDetail = 'サーバーへの接続がタイムアウトしました';
            }
            
            res.status(200).json({
                success: false,
                message: errorMessage,
                error: errorDetail,
                details: {
                    host: config.host,
                    port: config.port,
                    username: config.username,
                    protocol: 'sftp'
                }
            });
        } finally {
            try {
                await sftp.end();
            } catch (e) {
                // 接続終了エラーは無視
            }
        }
    }
});

// Upload file (SFTP or FTP)
app.post('/api/upload', upload.single('file'), async (req, res) => {
    console.log('Upload request received');
    console.log('Body:', req.body);
    console.log('File:', req.file ? req.file.originalname : 'No file');
    
    if (!req.file) {
        console.error('No file in request');
        return res.status(400).json({
            success: false,
            message: 'ファイルが選択されていません',
            error: 'No file uploaded. Please re-select the file if this is a scheduled upload after page reload.'
        });
    }
    
    const protocol = req.body.protocol || 'sftp';
    
    // パスワードチェック
    if (!req.body.password) {
        // Clean up local file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
            success: false,
            message: 'パスワードが入力されていません',
            error: 'Password is required'
        });
    }
    
    try {
        console.log(`Uploading file via ${protocol.toUpperCase()}:`, req.file.filename);
        console.log('Original filename:', req.file.originalname);
        console.log('File size:', req.file.size, 'bytes');
        
        // CSVファイルの場合、エンコーディングを確認して変換
        if (req.file.originalname.toLowerCase().endsWith('.csv')) {
            try {
                const filePath = req.file.path;
                let content = fs.readFileSync(filePath);
                
                console.log('CSV file detected, checking encoding...');
                console.log('File size:', content.length, 'bytes');
                
                // エンコーディングを検出
                let encodingDetected = 'unknown';
                let needsConversion = false;
                
                // BOMチェック
                if (content.length >= 3 && content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
                    console.log('✅ UTF-8 BOM検出 - 変換不要');
                    encodingDetected = 'UTF-8 BOM';
                } else {
                    // まずShift-JISとして読み込んでみる
                    let isShiftJIS = false;
                    let sjisText = '';
                    
                    try {
                        sjisText = iconv.decode(content, 'Shift_JIS');
                        // Shift-JISでデコードした結果に日本語が含まれているかチェック
                        const hasJapaneseInSJIS = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(sjisText);
                        const hasNoMojibakeInSJIS = !sjisText.includes('�');
                        
                        if (hasJapaneseInSJIS && hasNoMojibakeInSJIS) {
                            isShiftJIS = true;
                            encodingDetected = 'Shift-JIS';
                        }
                    } catch (e) {
                        console.log('Not Shift-JIS:', e.message);
                    }
                    
                    if (isShiftJIS) {
                        // Shift-JISからUTF-8 BOMに変換
                        const bomBuffer = Buffer.from('\uFEFF' + sjisText, 'utf8');
                        fs.writeFileSync(filePath, bomBuffer);
                        console.log('✅ Shift-JIS → UTF-8 BOM変換完了');
                        needsConversion = true;
                        
                        // 改行コードをCRLFに統一
                        let convertedContent = fs.readFileSync(filePath, 'utf8');
                        convertedContent = convertedContent.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
                        fs.writeFileSync(filePath, convertedContent, 'utf8');
                        console.log('✅ 改行コードをCRLFに統一');
                    } else {
                        // UTF-8として処理
                        const utf8Text = content.toString('utf8');
                        const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(utf8Text);
                        const hasMojibake = utf8Text.includes('�');
                        
                        if (!hasMojibake && (hasJapanese || utf8Text.length > 0)) {
                            // UTF-8（BOMなし）
                            encodingDetected = 'UTF-8 (no BOM)';
                            
                            // BOMを追加
                            const bomBuffer = Buffer.from('\uFEFF' + utf8Text, 'utf8');
                            fs.writeFileSync(filePath, bomBuffer);
                            console.log('✅ UTF-8 BOM追加完了');
                            needsConversion = true;
                            
                            // 改行コードをCRLFに統一
                            let convertedContent = fs.readFileSync(filePath, 'utf8');
                            convertedContent = convertedContent.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
                            fs.writeFileSync(filePath, convertedContent, 'utf8');
                            console.log('✅ 改行コードをCRLFに統一');
                        } else {
                            console.log('⚠️ エンコーディング不明 - そのまま処理');
                            encodingDetected = 'unknown';
                        }
                    }
                }
                
                console.log(`📝 エンコーディング: ${encodingDetected}`);
                console.log(`📝 変換実施: ${needsConversion ? 'はい' : 'いいえ'}`);
                
            } catch (error) {
                console.error('❌ エンコーディング変換エラー:', error);
            }
        }
        
        const localPath = req.file.path;
        let uploadPath = req.body.uploadPath || req.body.path || '/';
        
        // Fix problematic paths for test.rebex.net
        if (req.body.host === 'test.rebex.net' && (uploadPath === '/pub' || uploadPath.startsWith('/pub/'))) {
            console.log(`⚠️ Fixing read-only path: ${uploadPath} → /`);
            uploadPath = '/';
        }
        
        // Fix path for Rakuten RMS
        if (req.body.host && req.body.host.includes('rakuten')) {
            if (uploadPath === '/pub' || uploadPath === '/pub/example') {
                console.log(`⚠️ Fixing Rakuten path: ${uploadPath} → /ritem`);
                uploadPath = '/ritem';
            }
        }
        
        let remotePath = uploadPath.endsWith('/') 
            ? `${uploadPath}${req.file.originalname}`
            : `${uploadPath}/${req.file.originalname}`;
        
        // ファイル名を正しくデコード
        let decodedFilename = req.file.originalname;
        try {
            // Multerはバイナリとして扱うので、UTF-8として再解釈
            if (Buffer.isBuffer(req.file.originalname)) {
                decodedFilename = req.file.originalname.toString('utf8');
            } else {
                // 文字列の場合、latin1からUTF-8に変換を試みる
                const buffer = Buffer.from(req.file.originalname, 'latin1');
                const utf8Name = buffer.toString('utf8');
                // 変換後に文字化けしていないかチェック
                if (!utf8Name.includes('�')) {
                    decodedFilename = utf8Name;
                }
            }
        } catch (e) {
            console.error('ファイル名デコードエラー:', e);
        }
        
        if (protocol === 'ftp') {
            // FTPアップロード
            const config = getFtpConfig(req.body);
            const ftp = new FTPClient();
            
            try {
                await ftp.access(config);
                await ftp.uploadFrom(localPath, remotePath);
                
                // Verify upload
                const list = await ftp.list(uploadPath);
                const exists = list.some(item => item.name === req.file.originalname);
                
                res.json({
                    success: true,
                    message: 'FTPファイルアップロード成功！',
                    details: {
                        filename: decodedFilename,
                        size: req.file.size,
                        remotePath: remotePath,
                        protocol: 'ftp',
                        verified: exists
                    }
                });
            } finally {
                ftp.close();
            }
        } else {
            // SFTPアップロード
            const config = getSftpConfig(req.body);
            const sftp = new Client();
            
            try {
                await sftp.connect(config);
                
                // For test.rebex.net, use the correct upload path
                if (config.host === 'test.rebex.net') {
                    // test.rebex.netでは、/pub/exampleディレクトリに書き込み可能
                    if (!remotePath.includes('/pub/example')) {
                        const filename = path.basename(remotePath);
                        remotePath = `/pub/example/${filename}`;
                    }
                }
                
                console.log(`Attempting to upload to: ${remotePath}`);
                await sftp.put(localPath, remotePath);
                
                // Verify upload
                const exists = await sftp.exists(remotePath);
                
                res.json({
                    success: true,
                    message: 'SFTPファイルアップロード成功！',
                    details: {
                        filename: decodedFilename,
                        size: req.file.size,
                        remotePath: remotePath,
                        protocol: 'sftp',
                        verified: exists
                    }
                });
            } finally {
                await sftp.end();
            }
        }
        
        // Clean up local file
        fs.unlinkSync(localPath);
        
    } catch (error) {
        console.error('Upload error:', error);
        
        // Clean up local file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            message: 'アップロード失敗',
            error: error.message
        });
    }
});

// Browse directory contents (SFTP or FTP)
app.post('/api/browse', async (req, res) => {
    const protocol = req.body.protocol || 'sftp';
    const dirPath = req.body.path || '/';
    
    try {
        if (protocol === 'ftp') {
            // FTP directory browsing
            const config = getFtpConfig(req.body);
            const ftp = new FTPClient();
            
            try {
                await ftp.access(config);
                const list = await ftp.list(dirPath);
                
                const files = list.map(item => ({
                    name: item.name,
                    type: item.type === 2 ? 'directory' : 'file',
                    size: item.size || 0,
                    date: item.date
                }));
                
                res.json({
                    success: true,
                    path: dirPath,
                    files: files
                });
            } finally {
                ftp.close();
            }
        } else {
            // SFTP directory browsing
            const config = getSftpConfig(req.body);
            const sftp = new Client();
            
            try {
                await sftp.connect(config);
                let list;
                try {
                    list = await sftp.list(dirPath);
                } catch (e) {
                    // 指定パスの一覧に失敗した場合、ホームにフォールバック
                    let baseDir = '/';
                    try { baseDir = await sftp.realPath('.') || '/'; } catch (_) {}
                    list = await sftp.list(baseDir);
                }
                
                const files = list.map(item => ({
                    name: item.name,
                    type: item.type === 'd' ? 'directory' : 'file',
                    size: item.size || 0,
                    date: item.modifyTime
                }));
                
                res.json({
                    success: true,
                    path: dirPath,
                    files: files
                });
            } finally {
                await sftp.end();
            }
        }
    } catch (error) {
        console.error('Browse error:', error);
        res.status(500).json({
            success: false,
            message: 'ディレクトリの参照に失敗しました',
            error: error.message
        });
    }
});

// Check directory existence (SFTP or FTP)
app.post('/api/check-directory', async (req, res) => {
    const protocol = req.body.protocol || 'sftp';
    const directory = req.body.directory || '/';
    
    if (protocol === 'ftp') {
        // FTPディレクトリ確認
        const config = getFtpConfig(req.body);
        const ftp = new FTPClient();
        
        try {
            await ftp.access(config);
            
            // ディレクトリの存在確認
            try {
                const list = await ftp.list(directory);
                res.json({
                    success: true,
                    exists: true,
                    message: `ディレクトリ ${directory} が存在します`,
                    details: {
                        path: directory,
                        protocol: 'ftp',
                        itemCount: list.length,
                        items: list.slice(0, 5).map(item => ({
                            name: item.name,
                            type: item.isDirectory ? 'directory' : 'file'
                        }))
                    }
                });
            } catch (listError) {
                res.json({
                    success: false,
                    exists: false,
                    message: `ディレクトリ ${directory} が見つかりません`,
                    details: {
                        path: directory,
                        protocol: 'ftp'
                    }
                });
            }
        } catch (error) {
            console.error('FTP directory check error:', error);
            res.status(500).json({
                success: false,
                message: 'FTPディレクトリ確認失敗',
                error: error.message
            });
        } finally {
            ftp.close();
        }
    } else {
        // SFTPディレクトリ確認
        const config = getSftpConfig(req.body);
        const sftp = new Client();
        
        try {
            await sftp.connect(config);
            
            // 指定ディレクトリの存在確認。失敗時はホームへフォールバック
            let target = directory;
            let exists = false;
            try { exists = !!(await sftp.exists(target)); } catch (_) {}
            if (!exists) {
                try {
                    const home = await sftp.realPath('.') || '/';
                    target = home;
                    exists = !!(await sftp.exists(target));
                } catch (_) {}
            }
            
            if (exists) {
                try {
                    const list = await sftp.list(target);
                    res.json({
                        success: true,
                        exists: true,
                        message: `ディレクトリ ${target} が存在します`,
                        details: {
                            path: target,
                            protocol: 'sftp',
                            itemCount: list.length,
                            items: list.slice(0, 5).map(item => ({
                                name: item.name,
                                type: item.type === 'd' ? 'directory' : 'file'
                            }))
                        }
                    });
                } catch (_) {
                    res.json({ success: true, exists: true, message: `ディレクトリ ${target} は存在しますが一覧取得できません` });
                }
            } else {
                res.json({
                    success: false,
                    exists: false,
                    message: `ディレクトリ ${directory} が見つかりません`,
                    details: { path: directory, protocol: 'sftp' }
                });
            }
        } catch (error) {
            console.error('SFTP directory check error:', error);
            res.status(500).json({
                success: false,
                message: 'SFTPディレクトリ確認失敗',
                error: error.message
            });
        } finally {
            await sftp.end();
        }
    }
});

// List remote files (SFTP or FTP)
app.post('/api/list-files', async (req, res) => {
    const protocol = req.body.protocol || 'sftp';
    const dirPath = req.body.path || '/';
    
    if (protocol === 'ftp') {
        // FTPファイル一覧
        const config = getFtpConfig(req.body);
        const ftp = new FTPClient();
        
        try {
            await ftp.access(config);
            const list = await ftp.list(dirPath);
            
            res.json({
                success: true,
                path: dirPath,
                protocol: 'ftp',
                files: list.map(item => ({
                    name: item.name,
                    type: item.isDirectory ? 'directory' : 'file',
                    size: item.size,
                    modifyTime: item.modifiedAt,
                    accessTime: item.modifiedAt
                }))
            });
        } catch (error) {
            console.error('FTP list files error:', error);
            res.status(500).json({
                success: false,
                message: 'FTPファイル一覧取得失敗',
                error: error.message
            });
        } finally {
            ftp.close();
        }
    } else {
        // SFTPファイル一覧
        const config = getSftpConfig(req.body);
        const sftp = new Client();
        
        try {
            await sftp.connect(config);
            let list;
            try {
                list = await sftp.list(dirPath);
            } catch (e) {
                let baseDir = '/';
                try { baseDir = await sftp.realPath('.') || '/'; } catch (_) {}
                list = await sftp.list(baseDir);
            }
            
            res.json({
                success: true,
                path: dirPath,
                protocol: 'sftp',
                files: list.map(item => ({
                    name: item.name,
                    type: item.type === 'd' ? 'directory' : 'file',
                    size: item.size,
                    modifyTime: item.modifyTime,
                    accessTime: item.accessTime
                }))
            });
        } catch (error) {
            console.error('SFTP list files error:', error);
            res.status(500).json({
                success: false,
                message: 'SFTPファイル一覧取得失敗',
                error: error.message
            });
        } finally {
            await sftp.end();
        }
    }
});

// Preview file content with encoding detection
app.post('/api/preview-file', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'ファイルが選択されていません'
        });
    }
    
    try {
        const filePath = req.file.path;
        let content = fs.readFileSync(filePath);
        
        const result = {
            filename: req.file.originalname,
            size: req.file.size,
            encoding: 'unknown',
            hasJapanese: false,
            hasMojibake: false,
            preview: '',
            converted: false,
            convertedPreview: ''
        };
        
        // エンコーディング検出
        if (content.length >= 3 && content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
            // UTF-8 BOM
            result.encoding = 'UTF-8 (BOM)';
            const text = content.toString('utf8').substring(1); // BOMをスキップ
            result.hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
            result.hasMojibake = text.includes('�');
            result.preview = text.split('\n').slice(0, 10).join('\n');
        } else {
            // Shift-JISチェック
            let sjisText = '';
            let utf8Text = '';
            let isShiftJIS = false;
            
            try {
                sjisText = iconv.decode(content, 'Shift_JIS');
                const hasJapaneseInSJIS = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(sjisText);
                const hasNoMojibakeInSJIS = !sjisText.includes('�');
                
                if (hasJapaneseInSJIS && hasNoMojibakeInSJIS) {
                    isShiftJIS = true;
                    result.encoding = 'Shift-JIS';
                }
            } catch (e) {
                console.log('Not Shift-JIS');
            }
            
            // UTF-8チェック
            try {
                utf8Text = content.toString('utf8');
                const hasJapaneseInUTF8 = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(utf8Text);
                const hasNoMojibakeInUTF8 = !utf8Text.includes('�');
                
                if (!isShiftJIS && hasJapaneseInUTF8 && hasNoMojibakeInUTF8) {
                    result.encoding = 'UTF-8 (no BOM)';
                    result.hasJapanese = true;
                    result.preview = utf8Text.split('\n').slice(0, 10).join('\n');
                }
            } catch (e) {
                console.log('UTF-8 decode error');
            }
            
            if (isShiftJIS) {
                result.hasJapanese = true;
                result.preview = sjisText.split('\n').slice(0, 10).join('\n');
                
                // UTF-8 BOMに変換したプレビューも提供
                result.converted = true;
                result.convertedPreview = sjisText.split('\n').slice(0, 10).join('\n');
            } else if (result.encoding === 'unknown') {
                // ASCII or other
                result.preview = utf8Text.split('\n').slice(0, 10).join('\n');
                result.hasMojibake = utf8Text.includes('�');
            }
        }
        
        // Clean up
        fs.unlinkSync(filePath);
        
        res.json({
            success: true,
            ...result
        });
        
    } catch (error) {
        console.error('Preview error:', error);
        
        // Clean up on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            message: 'プレビュー失敗',
            error: error.message
        });
    }
});

// ===== Lightweight helper APIs expected by the frontend =====
// 1) FTP connections list/create
const FTP_DB_FILE = path.join(DATA_DIR, 'ftp-connections.json');
// GET /api/ftp - list saved connections (without passwords)
app.get('/api/ftp', (req, res) => {
    const list = readJson(FTP_DB_FILE, []);
    const sanitized = list.map(c => ({
        id: c.id,
        name: c.name,
        host: c.host,
        port: c.port,
        user: c.user,
        protocol: c.protocol || 'ftp',
        secure: !!c.secure,
        default_directory: c.default_directory || '/'
    }));
    res.json(sanitized);
});

// POST /api/ftp - create or return existing connection
app.post('/api/ftp', (req, res) => {
    const body = req.body || {};
    const required = ['name', 'host', 'user'];
    for (const f of required) {
        if (!body[f]) return res.status(400).json({ error: `Missing field: ${f}` });
    }
    const db = readJson(FTP_DB_FILE, []);
    const key = (c) => `${(c.name||'').trim()}|${(c.host||'').trim()}|${(c.user||'').trim()}`;
    const existing = db.find(c => key(c) === key(body));
    if (existing) {
        return res.json({
            id: existing.id,
            name: existing.name,
            host: existing.host,
            port: existing.port,
            user: existing.user,
            protocol: existing.protocol || 'ftp',
            secure: !!existing.secure,
            default_directory: existing.default_directory || '/'
        });
    }
    const id = db.length > 0 ? Math.max(...db.map(c => Number(c.id)||0)) + 1 : 1;
    const rec = {
        id,
        name: String(body.name),
        host: String(body.host),
        port: Number(body.port) || (body.protocol === 'sftp' ? 22 : 21),
        user: String(body.user),
        password: body.password || '', // stored locally; not returned in GET
        protocol: body.protocol || 'ftp',
        secure: !!body.secure,
        default_directory: body.default_directory || '/'
    };
    db.push(rec);
    writeJson(FTP_DB_FILE, db);
    res.json({
        id: rec.id,
        name: rec.name,
        host: rec.host,
        port: rec.port,
        user: rec.user,
        protocol: rec.protocol,
        secure: rec.secure,
        default_directory: rec.default_directory
    });
});

// 2) Multiple CSV upload endpoint (stores locally, returns names)
// POST /api/uploads/csv/multiple  (field: files)
app.post('/api/uploads/csv/multiple', upload.array('files'), async (req, res) => {
    try {
        const files = (req.files || []).map(f => ({
            originalName: f.originalname,
            filename: f.filename,
            size: f.size
        }));
        res.json({ success: true, files });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message || 'upload failed' });
    }
});

// 3) Batch schedule creation (stores combinations only; no executor)
const SCHEDULE_DB_FILE = path.join(DATA_DIR, 'schedules.json');
app.post('/api/schedules/batch', (req, res) => {
    try {
        const body = req.body || {};
        const combos = Array.isArray(body.combinations) ? body.combinations : [];
        if (combos.length === 0) return res.status(400).json({ error: 'combinations required' });
        const db = readJson(SCHEDULE_DB_FILE, []);
        const createdAt = new Date().toISOString();
        const baseId = db.length > 0 ? Math.max(...db.map(x => Number(x.id)||0)) + 1 : 1;
        const items = combos.map((c, idx) => ({
            id: baseId + idx,
            name: body.name || 'batch',
            cron_expression: body.cron_expression || '',
            source_directory: body.source_directory || '.',
            ftp_connection_id: c.ftp_connection_id,
            target_directory: c.target_directory || '/',
            selected_files: Array.isArray(c.selected_files) ? c.selected_files : [],
            status: 'scheduled',
            createdAt
        }));
        db.push(...items);
        writeJson(SCHEDULE_DB_FILE, db);
        res.json({ success: true, count: items.length, items });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message || 'schedule failed' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: {
            node: process.version,
            port: PORT,
            configuredHost: process.env.FTP_HOST || 'not configured'
        }
    });
});

// Start server
// API endpoint to save file temporarily for scheduled uploads
app.post('/api/save-temp-file', upload.single('file'), async (req, res) => {
    console.log('Save temp file request received');
    
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'ファイルが選択されていません'
        });
    }
    
    try {
        // Generate unique ID for the file
        const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fileExt = path.extname(req.file.originalname);
        const tempFileName = `${fileId}${fileExt}`;
        const tempFilePath = path.join(TEMP_FILES_DIR, tempFileName);
        
        // Move file to temp storage
        ensureDataDir();
        fs.renameSync(req.file.path, tempFilePath);
        
        // Save file metadata
        const metadata = {
            id: fileId,
            originalName: req.file.originalname,
            fileName: tempFileName,
            size: req.file.size,
            mimetype: req.file.mimetype,
            uploadedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60日（約2ヶ月）
        };
        
        const metadataFile = path.join(TEMP_FILES_DIR, `${fileId}.json`);
        fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
        
        console.log(`Temp file saved: ${tempFileName}`);
        
        res.json({
            success: true,
            fileId: fileId,
            message: 'ファイルが一時保存されました',
            expiresAt: metadata.expiresAt
        });
    } catch (error) {
        console.error('Save temp file error:', error);
        
        // Clean up on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            message: 'ファイルの一時保存に失敗しました',
            error: error.message
        });
    }
});

// API endpoint to upload using saved temp file
app.post('/api/upload-temp-file', async (req, res) => {
    console.log('Upload temp file request received');
    const { fileId, ...uploadParams } = req.body;
    
    if (!fileId) {
        return res.status(400).json({
            success: false,
            message: 'ファイルIDが指定されていません'
        });
    }
    
    try {
        // Load file metadata
        const metadataFile = path.join(TEMP_FILES_DIR, `${fileId}.json`);
        if (!fs.existsSync(metadataFile)) {
            return res.status(404).json({
                success: false,
                message: 'ファイルが見つかりません（期限切れまたは削除済み）'
            });
        }
        
        const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
        const tempFilePath = path.join(TEMP_FILES_DIR, metadata.fileName);
        
        if (!fs.existsSync(tempFilePath)) {
            // Clean up orphaned metadata
            fs.unlinkSync(metadataFile);
            return res.status(404).json({
                success: false,
                message: 'ファイルが見つかりません'
            });
        }
        
        // Check expiration
        if (new Date(metadata.expiresAt) < new Date()) {
            // Clean up expired file
            fs.unlinkSync(tempFilePath);
            fs.unlinkSync(metadataFile);
            return res.status(410).json({
                success: false,
                message: 'ファイルの有効期限が切れています'
            });
        }
        
        // Create fake req.file object for compatibility with existing upload logic
        const fakeFile = {
            path: tempFilePath,
            originalname: metadata.originalName,
            size: metadata.size,
            mimetype: metadata.mimetype,
            filename: metadata.fileName
        };
        
        // Use the upload logic
        const protocol = uploadParams.protocol || 'sftp';
        let uploadPath = uploadParams.uploadPath || '/';
        
        // Fix problematic paths for test.rebex.net
        if (uploadParams.host === 'test.rebex.net' && (uploadPath === '/pub' || uploadPath.startsWith('/pub/'))) {
            console.log(`⚠️ Fixing read-only path: ${uploadPath} → /`);
            uploadPath = '/';
        }
        
        // Fix path for Rakuten RMS
        if (uploadParams.host && uploadParams.host.includes('rakuten')) {
            if (uploadPath === '/pub' || uploadPath === '/pub/example') {
                console.log(`⚠️ Fixing Rakuten path: ${uploadPath} → /ritem`);
                uploadPath = '/ritem';
            }
        }
        
        console.log(`Uploading temp file via ${protocol}: ${metadata.originalName}`);
        
        if (protocol === 'ftp') {
            // FTP upload
            const config = getFtpConfig(uploadParams);
            const ftp = new FTPClient();
            
            await ftp.access(config);
            // パス安全化: ファイル名のみを使用してディレクトリトラバーサルを防ぐ
            const safeFileName = path.basename(metadata.originalName);
            const remotePath = path.posix.join(uploadPath, safeFileName);
            const stream = fs.createReadStream(tempFilePath);
            await ftp.uploadFrom(stream, remotePath);
            ftp.close();
            
            res.json({
                success: true,
                message: 'FTPファイルアップロード成功！',
                details: {
                    filename: metadata.originalName,
                    size: metadata.size,
                    remotePath: remotePath,
                    protocol: 'ftp'
                }
            });
        } else {
            // SFTP upload
            const config = getSftpConfig(uploadParams);
            const sftp = new Client();
            
            await sftp.connect(config);
            // パス安全化: ファイル名のみを使用してディレクトリトラバーサルを防ぐ
            const safeFileName = path.basename(metadata.originalName);
            const remotePath = path.posix.join(uploadPath, safeFileName);
            await sftp.put(tempFilePath, remotePath);
            const exists = await sftp.exists(remotePath);
            await sftp.end();
            
            res.json({
                success: true,
                message: 'SFTPファイルアップロード成功！',
                details: {
                    filename: metadata.originalName,
                    size: metadata.size,
                    remotePath: remotePath,
                    protocol: 'sftp',
                    verified: exists
                }
            });
        }
        
        // アップロード成功後、ファイルを削除してログのみ保持
        console.log(`Temp file uploaded successfully: ${metadata.originalName}`);
        
        // ファイル削除（ログは保持）
        try {
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
                console.log(`🗑️ Deleted temp file after successful upload: ${metadata.fileName}`);
            }
            
            // メタデータを圧縮形式に更新（ファイル本体の情報は削除）
            const compressedMetadata = {
                id: metadata.id,
                originalName: metadata.originalName,
                size: metadata.size,
                uploadedAt: metadata.uploadedAt,
                completedAt: new Date().toISOString(),
                status: 'uploaded',
                uploadPath: uploadPath,
                protocol: protocol
            };
            
            fs.writeFileSync(metadataFile, JSON.stringify(compressedMetadata, null, 2));
            console.log(`📝 Compressed metadata saved for: ${metadata.originalName}`);
        } catch (cleanupError) {
            console.error('Cleanup error after upload:', cleanupError);
        }
        
    } catch (error) {
        console.error('Upload temp file error:', error);
        res.status(500).json({
            success: false,
            message: 'アップロード失敗',
            error: error.message
        });
    }
});

// Cleanup old temp files (run every day)
setInterval(() => {
    console.log('🧹 Daily cleanup: Checking for files older than 60 days...');
    if (!fs.existsSync(TEMP_FILES_DIR)) return;
    
    const files = fs.readdirSync(TEMP_FILES_DIR);
    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    let cleaned = 0;
    
    files.forEach(file => {
        if (file.endsWith('.json')) {
            const metadataPath = path.join(TEMP_FILES_DIR, file);
            try {
                const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                const fileDate = new Date(metadata.uploadedAt || metadata.createdAt || metadata.expiresAt);
                
                // 60日以上古いファイルは削除（expiresAtに関係なく）
                if (fileDate < sixtyDaysAgo || new Date(metadata.expiresAt) < now) {
                    // Delete old or expired files
                    const tempFilePath = path.join(TEMP_FILES_DIR, metadata.fileName);
                    if (fs.existsSync(tempFilePath)) {
                        fs.unlinkSync(tempFilePath);
                    }
                    fs.unlinkSync(metadataPath);
                    cleaned++;
                    console.log(`Cleaned up expired file: ${metadata.originalName}`);
                }
            } catch (e) {
                // Invalid metadata file, delete it
                fs.unlinkSync(metadataPath);
            }
        }
    });
    
    if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} expired files`);
    }
}, 24 * 60 * 60 * 1000); // Every 24 hours (1日1回)

// 起動時に古いファイルをクリーンアップ
function cleanupOldFiles() {
    console.log('🧹 Cleaning up files older than 60 days...');
    if (!fs.existsSync(TEMP_FILES_DIR)) {
        ensureDataDir();
        return;
    }
    
    const files = fs.readdirSync(TEMP_FILES_DIR);
    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    let cleaned = 0;
    
    files.forEach(file => {
        if (file.endsWith('.json')) {
            const metadataPath = path.join(TEMP_FILES_DIR, file);
            try {
                const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                const createdDate = new Date(metadata.uploadedAt || metadata.createdAt);
                
                // 60日以上古いファイルは削除
                if (createdDate < sixtyDaysAgo) {
                    const tempFilePath = path.join(TEMP_FILES_DIR, metadata.fileName);
                    if (fs.existsSync(tempFilePath)) {
                        fs.unlinkSync(tempFilePath);
                    }
                    fs.unlinkSync(metadataPath);
                    cleaned++;
                    console.log(`🗑️ Deleted old file (>60 days): ${metadata.originalName}`);
                }
            } catch (e) {
                // Invalid metadata file, delete it
                fs.unlinkSync(metadataPath);
                cleaned++;
            }
        }
    });
    
    if (cleaned > 0) {
        console.log(`✅ Cleaned up ${cleaned} old files`);
    }
}

// 起動時にクリーンアップ実行
cleanupOldFiles();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
========================================
SFTP Test Server Started
========================================
Port: ${PORT}
URL: http://localhost:${PORT}
Health: http://localhost:${PORT}/api/health

Configuration:
- Host: ${process.env.FTP_HOST || 'upload.rakuten.ne.jp'}
- Port: ${process.env.FTP_PORT || '22'}
- User: ${process.env.FTP_USER || 'amicoco'}
========================================
    `);
});
