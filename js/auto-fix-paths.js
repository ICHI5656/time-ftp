/**
 * パス自動修正モジュール
 * /pub パスの問題を自動的に検出して修正
 */

// パス修正の設定
const PATH_FIX_CONFIG = {
    // 問題のあるパス
    problematicPaths: ['/pub', '/pub/example'],
    
    // サーバー別の正しいパス
    serverPaths: {
        rakuten: '/ritem',      // 楽天RMS
        rebex: '/',            // test.rebex.net
        default: '/'           // その他
    }
};

/**
 * スケジュールされたアップロードのパスを自動修正
 * @returns {number} 修正した数
 */
function autoFixScheduledPaths() {
    console.log('[PATH] スケジュールパスをチェック中...');
    
    const scheduledUploads = JSON.parse(localStorage.getItem('scheduledUploads') || '[]');
    let fixedCount = 0;
    
    scheduledUploads.forEach(task => {
        // パスが問題あるかチェック
        if (isProblematicPath(task.uploadPath)) {
            const oldPath = task.uploadPath;
            task.uploadPath = getCorrectPath(task);
            
            if (oldPath !== task.uploadPath) {
                console.log(`[PATH] 修正: ${task.name}: ${oldPath} → ${task.uploadPath}`);
                fixedCount++;
            }
        }
        
        // Access deniedエラーの自動リセット
        if (task.status === 'failed' && task.error && task.error.includes('Access denied')) {
            task.status = 'waiting';
            task.error = null;
            task.retryCount = 0;
            console.log(`[PATH] ステータスリセット: ${task.name}`);
            fixedCount++;
        }
    });
    
    if (fixedCount > 0) {
        localStorage.setItem('scheduledUploads', JSON.stringify(scheduledUploads));
        
        // UIを更新
        if (typeof updateScheduleQueue === 'function') {
            updateScheduleQueue();
        }
    }
    
    return fixedCount;
}

/**
 * プロファイルのデフォルトパスを自動修正
 * @returns {number} 修正した数
 */
function autoFixProfilePaths() {
    console.log('[PATH] プロファイルパスをチェック中...');
    
    const profiles = JSON.parse(localStorage.getItem('ftpProfiles') || '[]');
    let fixedCount = 0;
    
    profiles.forEach(profile => {
        if (isProblematicPath(profile.defaultDirectory)) {
            const oldPath = profile.defaultDirectory;
            profile.defaultDirectory = getCorrectPathForProfile(profile);
            
            if (oldPath !== profile.defaultDirectory) {
                console.log(`[PATH] プロファイル修正: ${profile.name || profile.host}: ${oldPath} → ${profile.defaultDirectory}`);
                fixedCount++;
            }
        }
    });
    
    if (fixedCount > 0) {
        localStorage.setItem('ftpProfiles', JSON.stringify(profiles));
        
        // グローバル変数も更新
        if (window.profiles) {
            window.profiles = profiles;
        }
    }
    
    return fixedCount;
}

/**
 * パスが問題あるかチェック
 * @param {string} path - チェックするパス
 * @returns {boolean} 問題がある場合true
 */
function isProblematicPath(path) {
    if (!path) return false;
    
    return PATH_FIX_CONFIG.problematicPaths.some(problematicPath => 
        path === problematicPath || path.startsWith(problematicPath + '/')
    );
}

/**
 * タスクに基づいて正しいパスを取得
 * @param {Object} task - タスクオブジェクト
 * @returns {string} 正しいパス
 */
function getCorrectPath(task) {
    if (task.profileId) {
        const profiles = JSON.parse(localStorage.getItem('ftpProfiles') || '[]');
        const profile = profiles.find(p => p.id === task.profileId);
        
        if (profile) {
            return getCorrectPathForProfile(profile);
        }
    }
    
    return PATH_FIX_CONFIG.serverPaths.default;
}

/**
 * プロファイルに基づいて正しいパスを取得
 * @param {Object} profile - プロファイルオブジェクト
 * @returns {string} 正しいパス
 */
function getCorrectPathForProfile(profile) {
    if (!profile || !profile.host) {
        return PATH_FIX_CONFIG.serverPaths.default;
    }
    
    // 楽天RMS
    if (profile.host.includes('rakuten')) {
        return PATH_FIX_CONFIG.serverPaths.rakuten;
    }
    
    // test.rebex.net
    if (profile.host === 'test.rebex.net') {
        return PATH_FIX_CONFIG.serverPaths.rebex;
    }
    
    return PATH_FIX_CONFIG.serverPaths.default;
}

/**
 * パス修正モジュールの初期化
 */
function initializePathFix() {
    console.log('[PATH] パス自動修正モジュールを初期化');
    
    // 初回実行
    autoFixScheduledPaths();
    autoFixProfilePaths();
    
    // 定期実行（5秒ごと）
    setInterval(() => {
        autoFixScheduledPaths();
    }, 5000);
    
    // プロファイルは30秒ごと
    setInterval(() => {
        autoFixProfilePaths();
    }, 30000);
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializePathFix,
        autoFixScheduledPaths,
        autoFixProfilePaths
    };
}