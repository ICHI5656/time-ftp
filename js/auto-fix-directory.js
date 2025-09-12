/**
 * ディレクトリ参照自動修正モジュール
 * ディレクトリブラウザの問題を自動的に修正
 */

/**
 * ディレクトリブラウザモーダルを作成
 * @returns {HTMLElement} 作成したモーダル要素
 */
function createDirectoryBrowserModal() {
    // 既存のモーダルをチェック
    let modal = document.getElementById('directoryBrowserModal');
    if (modal) {
        return modal;
    }
    
    // モーダルHTML
    const modalHTML = `
        <div id="directoryBrowserModal" style="
            display: none;
            position: fixed;
            z-index: 10000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        ">
            <div id="directoryModalContent" style="
                background: white;
                margin: 5% auto;
                padding: 20px;
                width: 80%;
                max-width: 600px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0;">📁 ディレクトリを選択</h2>
                    <span id="closeDirBrowser" style="
                        font-size: 28px;
                        font-weight: bold;
                        cursor: pointer;
                        color: #aaa;
                    ">&times;</span>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong>現在のパス:</strong> 
                    <span id="currentBrowsePath" style="font-family: monospace; color: #007bff;">/</span>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label>選択されたパス:</label>
                    <input type="text" id="selectedDirectoryPath" value="/" style="
                        width: 100%;
                        padding: 8px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-family: monospace;
                    ">
                </div>
                
                <div id="directoryLoading" style="display:none; text-align:center; padding:20px;">
                    <div>🔄 読み込み中...</div>
                </div>
                
                <div id="directoryList" style="
                    border: 1px solid #ddd;
                    height: 300px;
                    overflow-y: auto;
                    background: #f9f9f9;
                    border-radius: 4px;
                    padding: 10px;
                ">
                    <div style="text-align: center; color: #999;">ディレクトリを読み込み中...</div>
                </div>
                
                <div style="margin-top: 20px; text-align: right;">
                    <button id="confirmDirSelection" style="
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-right: 10px;
                    ">✅ 選択</button>
                    <button id="cancelDirSelection" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                    ">❌ キャンセル</button>
                </div>
            </div>
        </div>
    `;
    
    // DOMに追加
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modal = document.getElementById('directoryBrowserModal');
    
    // イベントリスナーを設定
    setupModalEventListeners(modal);
    
    console.log('[DIR] ディレクトリブラウザモーダルを作成');
    return modal;
}

/**
 * モーダルのイベントリスナーを設定
 * @param {HTMLElement} modal - モーダル要素
 */
function setupModalEventListeners(modal) {
    const closeBtn = document.getElementById('closeDirBrowser');
    const confirmBtn = document.getElementById('confirmDirSelection');
    const cancelBtn = document.getElementById('cancelDirSelection');
    
    // 閉じるボタン
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }
    
    // キャンセルボタン
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }
    
    // 選択ボタン
    if (confirmBtn) {
        confirmBtn.onclick = () => {
            confirmDirectorySelection();
            modal.style.display = 'none';
        };
    }
    
    // モーダル外クリックで閉じる
    modal.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

/**
 * ディレクトリ選択を確定
 */
function confirmDirectorySelection() {
    const selectedPath = document.getElementById('selectedDirectoryPath').value || '/';
    
    // メインエリアのアップロードディレクトリを更新
    const uploadDir = document.getElementById('uploadDirectory');
    if (uploadDir) {
        uploadDir.value = selectedPath;
    }
    
    // サイドバーのデフォルトディレクトリも更新
    const defaultDir = document.getElementById('defaultDirectory');
    if (defaultDir) {
        defaultDir.value = selectedPath;
    }
    
    // プロファイルに保存
    if (window.currentProfile) {
        window.currentProfile.defaultDirectory = selectedPath;
        
        const profiles = JSON.parse(localStorage.getItem('ftpProfiles') || '[]');
        const profileIndex = profiles.findIndex(p => p.id === window.currentProfile.id);
        if (profileIndex !== -1) {
            profiles[profileIndex].defaultDirectory = selectedPath;
            localStorage.setItem('ftpProfiles', JSON.stringify(profiles));
            window.profiles = profiles;
        }
    }
    
    console.log('[DIR] ディレクトリを選択:', selectedPath);
    
    if (typeof showToast === 'function') {
        showToast(`ディレクトリを ${selectedPath} に設定しました`, 'success');
    }
}

/**
 * ディレクトリ内容を読み込む
 * @param {string} path - 読み込むパス
 */
async function loadDirectoryContents(path) {
    console.log('[DIR] ディレクトリを読み込み:', path);
    
    const profile = window.currentProfile || window.browsingProfile;
    if (!profile) {
        alert('先にサーバーを選択してください');
        return;
    }
    
    const loadingEl = document.getElementById('directoryLoading');
    const listEl = document.getElementById('directoryList');
    
    if (loadingEl) loadingEl.style.display = 'block';
    if (listEl) listEl.innerHTML = '';
    
    try {
        const response = await fetch('/api/browse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                host: profile.host,
                port: parseInt(profile.port),
                username: profile.username,
                password: profile.password,
                protocol: profile.protocol,
                path: path || '/'
            })
        });
        
        const data = await response.json();
        
        if (loadingEl) loadingEl.style.display = 'none';
        
        if (data.success) {
            displayDirectoryContents(data.files || [], path);
        } else {
            if (listEl) {
                listEl.innerHTML = `<div style="color:red; padding:10px;">エラー: ${data.message}</div>`;
            }
        }
    } catch (error) {
        console.error('[DIR] 通信エラー:', error);
        if (loadingEl) loadingEl.style.display = 'none';
        if (listEl) {
            listEl.innerHTML = `<div style="color:red; padding:10px;">通信エラー: ${error.message}</div>`;
        }
    }
}

/**
 * ディレクトリ内容を表示
 * @param {Array} files - ファイルリスト
 * @param {string} path - 現在のパス
 */
function displayDirectoryContents(files, path) {
    window.currentBrowsingPath = path;
    
    // パス表示を更新
    const pathEl = document.getElementById('currentBrowsePath');
    if (pathEl) pathEl.textContent = path;
    
    const listEl = document.getElementById('directoryList');
    if (!listEl) return;
    
    let html = '';
    
    // 親ディレクトリへのリンク
    if (path !== '/') {
        html += `
            <div style="cursor:pointer; padding:8px; border-bottom:1px solid #eee; background:#fff;" 
                 onclick="navigateToParentDirectory()">
                <span style="color:#007bff;">📁 ..</span>
            </div>
        `;
    }
    
    // ディレクトリ
    files.filter(f => f.type === 'directory').forEach(file => {
        html += `
            <div style="cursor:pointer; padding:8px; border-bottom:1px solid #eee; background:#fff;" 
                 onclick="navigateToDirectory('${file.name}')">
                <span style="color:#007bff;">📁 ${file.name}</span>
            </div>
        `;
    });
    
    // ファイル（表示のみ）
    files.filter(f => f.type === 'file').forEach(file => {
        const size = file.size ? `(${(file.size/1024).toFixed(2)} KB)` : '';
        html += `
            <div style="padding:8px; border-bottom:1px solid #eee; color:#666; background:#f9f9f9;">
                📄 ${file.name} <small>${size}</small>
            </div>
        `;
    });
    
    listEl.innerHTML = html || '<div style="text-align:center; color:#999;">ディレクトリは空です</div>';
}

/**
 * ディレクトリに移動
 * @param {string} dirname - ディレクトリ名
 */
window.navigateToDirectory = function(dirname) {
    const newPath = window.currentBrowsingPath === '/' 
        ? `/${dirname}` 
        : `${window.currentBrowsingPath}/${dirname}`;
    
    const inputEl = document.getElementById('selectedDirectoryPath');
    if (inputEl) inputEl.value = newPath;
    
    loadDirectoryContents(newPath);
};

/**
 * 親ディレクトリに移動
 */
window.navigateToParentDirectory = function() {
    const parts = window.currentBrowsingPath.split('/').filter(p => p);
    parts.pop();
    const newPath = parts.length > 0 ? '/' + parts.join('/') : '/';
    
    const inputEl = document.getElementById('selectedDirectoryPath');
    if (inputEl) inputEl.value = newPath;
    
    loadDirectoryContents(newPath);
};

/**
 * ディレクトリブラウザを開く
 */
window.browseServerDirectory = async function() {
    console.log('[DIR] ディレクトリブラウザを開く');
    
    // プロファイルを確認
    if (!window.currentProfile) {
        if (window.profiles && window.profiles.length > 0) {
            window.currentProfile = window.profiles[0];
        } else {
            alert('先にプロファイルを作成してください');
            return;
        }
    }
    
    window.browsingProfile = window.currentProfile;
    window.currentBrowsingPath = window.currentProfile.defaultDirectory || '/';
    
    // モーダルを作成または取得
    const modal = createDirectoryBrowserModal();
    modal.style.display = 'block';
    
    // 初期パスを設定
    const pathEl = document.getElementById('currentBrowsePath');
    if (pathEl) pathEl.textContent = window.currentBrowsingPath;
    
    const inputEl = document.getElementById('selectedDirectoryPath');
    if (inputEl) inputEl.value = window.currentBrowsingPath;
    
    // ディレクトリ内容を読み込む
    await loadDirectoryContents(window.currentBrowsingPath);
};

// エイリアスを設定
window.browseUploadDirectory = window.browseServerDirectory;
window.browseServerDirectoryFromSidebar = window.browseServerDirectory;

/**
 * ディレクトリ参照ボタンを自動修正
 */
function autoFixDirectoryButtons() {
    console.log('[DIR] ディレクトリ参照ボタンをチェック中...');
    
    const buttons = document.querySelectorAll('button');
    let fixedCount = 0;
    
    buttons.forEach(button => {
        const text = button.textContent.trim();
        const onclick = button.getAttribute('onclick');
        
        // ディレクトリ参照に関連するボタンを特定
        if (text === '📁' || text === '参照' || 
            (onclick && (onclick.includes('browseUploadDirectory') || 
                        onclick.includes('browseServerDirectory') ||
                        onclick.includes('browseServerDirectoryFromSidebar')))) {
            
            // イベントハンドラを修正
            button.onclick = (e) => {
                e.preventDefault();
                window.browseServerDirectory();
            };
            
            // スタイルも修正
            button.style.cursor = 'pointer';
            button.style.opacity = '1';
            
            fixedCount++;
        }
    });
    
    if (fixedCount > 0) {
        console.log(`[DIR] ${fixedCount}個のボタンを修正`);
    }
    
    return fixedCount;
}

/**
 * ディレクトリ修正モジュールの初期化
 */
function initializeDirectoryFix() {
    console.log('[DIR] ディレクトリ自動修正モジュールを初期化');
    
    // モーダルを作成
    createDirectoryBrowserModal();
    
    // ボタンを修正
    autoFixDirectoryButtons();
    
    // 定期的にボタンを修正（10秒ごと）
    setInterval(() => {
        autoFixDirectoryButtons();
    }, 10000);
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeDirectoryFix,
        browseServerDirectory,
        autoFixDirectoryButtons
    };
}