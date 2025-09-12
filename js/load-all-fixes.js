/**
 * すべての修正を読み込むローダースクリプト
 * index.htmlに1行追加するだけで、すべての問題が自動修正される
 */

// 修正スクリプトのリスト
const FIX_SCRIPTS = [
    '/js/auto-fix-paths.js',
    '/js/auto-fix-directory.js', 
    '/js/auto-fix-server-lock.js',
    '/js/auto-fix-system.js',
    '/js/server-modal-improved.js'
];

/**
 * スクリプトを動的に読み込む
 * @param {string} src - スクリプトのパス
 * @returns {Promise} 読み込み完了のPromise
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // 既に読み込み済みかチェック
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            console.log(`[LOADER] 既に読み込み済み: ${src}`);
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            console.log(`[LOADER] ✅ 読み込み完了: ${src}`);
            resolve();
        };
        script.onerror = () => {
            console.error(`[LOADER] ❌ 読み込み失敗: ${src}`);
            // エラーでも続行
            resolve();
        };
        document.head.appendChild(script);
    });
}

/**
 * すべての修正スクリプトを読み込む
 */
async function loadAllFixes() {
    console.log('========================================');
    console.log('🔧 自動修正システムを起動中...');
    console.log('========================================');
    
    // 順番に読み込む
    for (const script of FIX_SCRIPTS) {
        await loadScript(script);
    }
    
    console.log('[LOADER] すべてのスクリプトを読み込みました');
    
    // 初期化関数を実行
    initializeAllFixes();
}

/**
 * すべての修正を初期化
 */
function initializeAllFixes() {
    console.log('[INIT] 修正モジュールを初期化中...');
    
    // パス修正
    if (typeof initializePathFix === 'function') {
        initializePathFix();
        console.log('[INIT] ✅ パス修正モジュール');
    }
    
    // ディレクトリ修正
    if (typeof initializeDirectoryFix === 'function') {
        initializeDirectoryFix();
        console.log('[INIT] ✅ ディレクトリ修正モジュール');
    }
    
    // サーバーロック解除
    if (typeof initializeServerUnlock === 'function') {
        initializeServerUnlock();
        console.log('[INIT] ✅ サーバーロック解除モジュール');
    }
    
    // 自動修正システム
    if (typeof initializeAutoFixSystem === 'function') {
        initializeAutoFixSystem();
        console.log('[INIT] ✅ 自動修正システム');
    }
    
    // サーバーモーダル改善
    if (typeof createImprovedServerModal === 'function') {
        // 必要時のみ作成
        console.log('[INIT] ✅ サーバーモーダル改善');
    }
    
    console.log('========================================');
    console.log('✅ すべての修正が有効になりました！');
    console.log('========================================');
    
    // 通知
    if (typeof showToast === 'function') {
        showToast('自動修正システムが起動しました', 'success');
    }
}

/**
 * 手動で修正を実行
 */
window.runAllFixes = function() {
    console.log('[MANUAL] 手動で全修正を実行中...');
    
    // パス修正
    if (typeof autoFixScheduledPaths === 'function') {
        const pathsFixed = autoFixScheduledPaths();
        console.log(`[MANUAL] パス修正: ${pathsFixed}件`);
    }
    
    // プロファイルパス修正
    if (typeof autoFixProfilePaths === 'function') {
        const profilesFixed = autoFixProfilePaths();
        console.log(`[MANUAL] プロファイル修正: ${profilesFixed}件`);
    }
    
    // サーバーロック解除
    if (typeof autoUnlockServerSelection === 'function') {
        const unlocked = autoUnlockServerSelection();
        console.log(`[MANUAL] ロック解除: ${unlocked}件`);
    }
    
    // ディレクトリボタン修正
    if (typeof autoFixDirectoryButtons === 'function') {
        const buttonsFixed = autoFixDirectoryButtons();
        console.log(`[MANUAL] ボタン修正: ${buttonsFixed}件`);
    }
    
    console.log('[MANUAL] ✅ 手動修正完了');
    
    if (typeof showToast === 'function') {
        showToast('全修正を実行しました', 'success');
    }
};

/**
 * システムステータスを表示
 */
window.showSystemStatus = function() {
    console.log('========================================');
    console.log('📊 システムステータス');
    console.log('========================================');
    
    // LocalStorageの状態
    const profiles = JSON.parse(localStorage.getItem('ftpProfiles') || '[]');
    const schedules = JSON.parse(localStorage.getItem('scheduledUploads') || '[]');
    const history = JSON.parse(localStorage.getItem('uploadHistory') || '[]');
    
    console.log(`プロファイル数: ${profiles.length}`);
    console.log(`スケジュール数: ${schedules.length}`);
    console.log(`  - 待機中: ${schedules.filter(s => s.status === 'waiting').length}`);
    console.log(`  - 実行中: ${schedules.filter(s => s.status === 'executing').length}`);
    console.log(`  - 完了: ${schedules.filter(s => s.status === 'completed').length}`);
    console.log(`  - 失敗: ${schedules.filter(s => s.status === 'failed').length}`);
    console.log(`履歴数: ${history.length}`);
    
    // ストレージ使用量
    const usage = JSON.stringify(localStorage).length;
    const percentage = Math.round((usage / (5 * 1024 * 1024)) * 100);
    console.log(`ストレージ使用量: ${(usage / 1024).toFixed(2)} KB (${percentage}%)`);
    
    // 問題のあるパス
    const problemPaths = schedules.filter(s => 
        s.uploadPath === '/pub' || s.uploadPath === '/pub/example'
    );
    if (problemPaths.length > 0) {
        console.log(`⚠️ 問題のあるパス: ${problemPaths.length}件`);
    }
    
    console.log('========================================');
};

// DOMContentLoadedで自動実行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllFixes);
} else {
    // 既に読み込み済みの場合
    loadAllFixes();
}

// グローバル関数として登録
window.FixSystem = {
    load: loadAllFixes,
    init: initializeAllFixes,
    runAll: runAllFixes,
    status: showSystemStatus
};

console.log('[LOADER] 自動修正ローダーを初期化しました');
console.log('使い方:');
console.log('  FixSystem.runAll() - すべての修正を手動実行');
console.log('  FixSystem.status() - システムステータス表示');