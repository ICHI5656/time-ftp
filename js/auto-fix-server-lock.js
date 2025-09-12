/**
 * サーバー選択ロック自動解除モジュール
 * サーバー選択が無効化される問題を自動修正
 */

/**
 * サーバー選択のロックを解除
 * @returns {number} 解除した要素数
 */
function autoUnlockServerSelection() {
    console.log('[LOCK] サーバー選択ロックをチェック中...');
    
    const selectors = [
        'uploadServerSelect',
        'profileSelect',
        'serverSelect'
    ];
    
    let unlockedCount = 0;
    
    selectors.forEach(id => {
        const element = document.getElementById(id);
        if (element && element.disabled) {
            element.disabled = false;
            element.removeAttribute('disabled');
            element.removeAttribute('readonly');
            element.style.opacity = '1';
            element.style.pointerEvents = 'auto';
            
            console.log(`[LOCK] ${id} のロックを解除`);
            unlockedCount++;
        }
    });
    
    // すべてのselect要素もチェック
    document.querySelectorAll('select').forEach(select => {
        if (select.id && (select.id.includes('server') || select.id.includes('profile'))) {
            if (select.disabled) {
                select.disabled = false;
                select.removeAttribute('disabled');
                unlockedCount++;
            }
        }
    });
    
    return unlockedCount;
}

/**
 * サーバー切り替え機能を修正
 */
function fixServerSwitching() {
    console.log('[LOCK] サーバー切り替え機能を修正中...');
    
    // メインエリアの選択ボックス
    const uploadServerSelect = document.getElementById('uploadServerSelect');
    if (uploadServerSelect) {
        // 既存のイベントリスナーを削除して新しく追加
        const newSelect = uploadServerSelect.cloneNode(true);
        uploadServerSelect.parentNode.replaceChild(newSelect, uploadServerSelect);
        
        newSelect.addEventListener('change', function() {
            const selectedId = parseInt(this.value);
            if (selectedId && !isNaN(selectedId)) {
                const profiles = JSON.parse(localStorage.getItem('ftpProfiles') || '[]');
                const profile = profiles.find(p => p.id === selectedId);
                
                if (profile) {
                    window.currentProfile = profile;
                    
                    // サイドバーも同期
                    const profileSelect = document.getElementById('profileSelect');
                    if (profileSelect) {
                        profileSelect.value = String(selectedId);
                    }
                    
                    console.log(`[LOCK] サーバー切り替え: ${profile.name || profile.host}`);
                    
                    if (typeof updateServerConfig === 'function') {
                        updateServerConfig();
                    }
                    
                    if (typeof showToast === 'function') {
                        showToast(`${profile.name || profile.host} に切り替えました`, 'success');
                    }
                }
            }
        });
    }
}

/**
 * サーバーロック解除モジュールの初期化
 */
function initializeServerUnlock() {
    console.log('[LOCK] サーバーロック解除モジュールを初期化');
    
    // 初回実行
    autoUnlockServerSelection();
    fixServerSwitching();
    
    // 定期実行（3秒ごと）
    setInterval(() => {
        autoUnlockServerSelection();
    }, 3000);
    
    // サーバー切り替え修正は10秒ごと
    setInterval(() => {
        fixServerSwitching();
    }, 10000);
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeServerUnlock,
        autoUnlockServerSelection,
        fixServerSwitching
    };
}