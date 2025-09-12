/**
 * 統合自動修正システム
 * すべての自動修正モジュールを管理・実行
 */

// 自動修正システムの設定
const AUTO_FIX_CONFIG = {
    enabled: true,
    modules: {
        paths: true,          // パス修正
        directory: true,      // ディレクトリ参照
        serverLock: true,     // サーバーロック解除
        storage: true         // ストレージ管理
    },
    intervals: {
        paths: 5000,          // 5秒
        directory: 10000,     // 10秒
        serverLock: 3000,     // 3秒
        storage: 30000        // 30秒
    }
};

/**
 * ストレージ容量を自動管理
 */
function autoManageStorage() {
    console.log('[STORAGE] ストレージ容量をチェック中...');
    
    const usage = JSON.stringify(localStorage).length;
    const estimatedMax = 5 * 1024 * 1024; // 5MB
    const percentage = Math.round((usage / estimatedMax) * 100);
    
    console.log(`[STORAGE] 使用量: ${(usage / 1024).toFixed(2)} KB (${percentage}%)`);
    
    // 80%を超えたら警告
    if (percentage > 80) {
        console.warn(`[STORAGE] ⚠️ 容量警告: ${percentage}%`);
        
        // 90%を超えたら自動クリーンアップ
        if (percentage > 90) {
            autoCleanupOldData();
        }
    }
    
    return percentage;
}

/**
 * 古いデータを自動クリーンアップ
 */
function autoCleanupOldData() {
    console.log('[STORAGE] 古いデータをクリーンアップ中...');
    
    const scheduledUploads = JSON.parse(localStorage.getItem('scheduledUploads') || '[]');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // 30日以上前の完了タスクを削除
    const filtered = scheduledUploads.filter(task => {
        if (task.status === 'completed' && task.completedAt) {
            const completedDate = new Date(task.completedAt);
            return completedDate > thirtyDaysAgo;
        }
        return true;
    });
    
    const removed = scheduledUploads.length - filtered.length;
    
    if (removed > 0) {
        localStorage.setItem('scheduledUploads', JSON.stringify(filtered));
        console.log(`[STORAGE] ${removed}件の古いタスクを削除`);
        
        // UIを更新
        if (typeof updateScheduleQueue === 'function') {
            updateScheduleQueue();
        }
    }
    
    // アップロード履歴もクリーンアップ
    const uploadHistory = JSON.parse(localStorage.getItem('uploadHistory') || '[]');
    if (uploadHistory.length > 100) {
        const trimmed = uploadHistory.slice(-100);
        localStorage.setItem('uploadHistory', JSON.stringify(trimmed));
        console.log(`[STORAGE] 履歴を100件に制限`);
    }
    
    return removed;
}

/**
 * システムヘルスチェック
 */
function performHealthCheck() {
    console.log('[HEALTH] システムヘルスチェック実行');
    
    const health = {
        storage: autoManageStorage(),
        profiles: JSON.parse(localStorage.getItem('ftpProfiles') || '[]').length,
        schedules: JSON.parse(localStorage.getItem('scheduledUploads') || '[]').length,
        history: JSON.parse(localStorage.getItem('uploadHistory') || '[]').length
    };
    
    console.log('[HEALTH] ステータス:', health);
    
    return health;
}

/**
 * 自動修正システムの初期化
 */
function initializeAutoFixSystem() {
    console.log('========================================');
    console.log('🔧 自動修正システムを起動');
    console.log('========================================');
    
    // ヘルスチェック
    const health = performHealthCheck();
    
    // 各モジュールの初期化
    if (AUTO_FIX_CONFIG.modules.paths) {
        if (typeof initializePathFix === 'function') {
            initializePathFix();
        }
    }
    
    if (AUTO_FIX_CONFIG.modules.directory) {
        if (typeof initializeDirectoryFix === 'function') {
            initializeDirectoryFix();
        }
    }
    
    if (AUTO_FIX_CONFIG.modules.serverLock) {
        if (typeof initializeServerUnlock === 'function') {
            initializeServerUnlock();
        }
    }
    
    // ストレージ管理の定期実行
    if (AUTO_FIX_CONFIG.modules.storage) {
        setInterval(() => {
            autoManageStorage();
        }, AUTO_FIX_CONFIG.intervals.storage);
    }
    
    // ヘルスチェックは1分ごと
    setInterval(() => {
        performHealthCheck();
    }, 60000);
    
    console.log('[SYSTEM] ✅ 自動修正システムが有効になりました');
    console.log('[SYSTEM] 有効なモジュール:', Object.keys(AUTO_FIX_CONFIG.modules).filter(m => AUTO_FIX_CONFIG.modules[m]));
    
    // 通知
    if (typeof showToast === 'function') {
        showToast('自動修正システムが有効になりました', 'success');
    }
}

/**
 * 自動修正システムを無効化
 */
window.disableAutoFix = function() {
    AUTO_FIX_CONFIG.enabled = false;
    console.log('[SYSTEM] 自動修正システムを無効化しました');
    
    if (typeof showToast === 'function') {
        showToast('自動修正システムを無効化しました', 'info');
    }
};

/**
 * 自動修正システムを有効化
 */
window.enableAutoFix = function() {
    AUTO_FIX_CONFIG.enabled = true;
    console.log('[SYSTEM] 自動修正システムを有効化しました');
    
    if (typeof showToast === 'function') {
        showToast('自動修正システムを有効化しました', 'success');
    }
};

/**
 * 手動で全修正を実行
 */
window.runAllFixes = function() {
    console.log('[SYSTEM] 手動で全修正を実行中...');
    
    // パス修正
    if (typeof autoFixScheduledPaths === 'function') {
        autoFixScheduledPaths();
    }
    if (typeof autoFixProfilePaths === 'function') {
        autoFixProfilePaths();
    }
    
    // サーバーロック解除
    if (typeof autoUnlockServerSelection === 'function') {
        autoUnlockServerSelection();
    }
    
    // ディレクトリボタン修正
    if (typeof autoFixDirectoryButtons === 'function') {
        autoFixDirectoryButtons();
    }
    
    // ストレージクリーンアップ
    autoCleanupOldData();
    
    console.log('[SYSTEM] ✅ 全修正を完了しました');
    
    if (typeof showToast === 'function') {
        showToast('全修正を完了しました', 'success');
    }
};

/**
 * システムステータスを表示
 */
window.showSystemStatus = function() {
    const health = performHealthCheck();
    
    console.log('========================================');
    console.log('📊 システムステータス');
    console.log('========================================');
    console.log(`自動修正: ${AUTO_FIX_CONFIG.enabled ? '有効' : '無効'}`);
    console.log(`ストレージ使用率: ${health.storage}%`);
    console.log(`プロファイル数: ${health.profiles}`);
    console.log(`スケジュール数: ${health.schedules}`);
    console.log(`履歴数: ${health.history}`);
    console.log('========================================');
    
    return health;
};

// DOMContentLoadedで自動起動
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAutoFixSystem);
} else {
    // 既に読み込み済みの場合は即実行
    initializeAutoFixSystem();
}

// グローバル関数として登録
window.AutoFixSystem = {
    init: initializeAutoFixSystem,
    enable: enableAutoFix,
    disable: disableAutoFix,
    runAll: runAllFixes,
    status: showSystemStatus,
    config: AUTO_FIX_CONFIG
};

console.log('[SYSTEM] 自動修正システムモジュールをロード完了');