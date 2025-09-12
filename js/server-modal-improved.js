/**
 * サーバー追加モーダルの改善版
 * より見やすく、使いやすいUI
 */

/**
 * 改善されたサーバー追加モーダルを作成
 */
function createImprovedServerModal() {
    console.log('[SERVER] 改善版サーバー追加モーダルを作成');
    
    // 既存のモーダルを削除
    const existingModal = document.getElementById('serverModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // モーダルHTML
    const modalHTML = `
        <div id="serverModal" class="modal" style="
            display: none;
            position: fixed;
            z-index: 10000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(5px);
        ">
            <div class="modal-content" style="
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                margin: 3% auto;
                padding: 0;
                width: 90%;
                max-width: 700px;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideIn 0.3s ease-out;
            ">
                <!-- ヘッダー -->
                <div style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px 30px;
                    border-radius: 16px 16px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h2 style="margin: 0; font-size: 24px; font-weight: 600;">
                        🔌 新しいサーバーを追加
                    </h2>
                    <span id="closeServerModal" style="
                        font-size: 32px;
                        cursor: pointer;
                        opacity: 0.8;
                        transition: opacity 0.2s;
                    " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">
                        ×
                    </span>
                </div>
                
                <!-- ボディ -->
                <div style="padding: 30px;">
                    <!-- プロトコル選択 -->
                    <div style="margin-bottom: 25px;">
                        <label style="
                            display: block;
                            margin-bottom: 10px;
                            font-weight: 600;
                            color: #333;
                            font-size: 14px;
                        ">
                            接続プロトコル
                        </label>
                        <div style="display: flex; gap: 10px;">
                            <button id="sftpProtocolBtn" class="protocol-btn active" style="
                                flex: 1;
                                padding: 12px;
                                border: 2px solid #667eea;
                                background: #667eea;
                                color: white;
                                border-radius: 8px;
                                cursor: pointer;
                                font-size: 16px;
                                font-weight: 500;
                                transition: all 0.3s;
                            ">
                                🔒 SFTP (推奨)
                            </button>
                            <button id="ftpProtocolBtn" class="protocol-btn" style="
                                flex: 1;
                                padding: 12px;
                                border: 2px solid #dee2e6;
                                background: white;
                                color: #495057;
                                border-radius: 8px;
                                cursor: pointer;
                                font-size: 16px;
                                font-weight: 500;
                                transition: all 0.3s;
                            ">
                                📁 FTP
                            </button>
                        </div>
                    </div>
                    
                    <!-- サーバー情報入力 -->
                    <div style="
                        background: #f8f9fa;
                        border-radius: 12px;
                        padding: 20px;
                        margin-bottom: 20px;
                    ">
                        <h3 style="margin: 0 0 20px 0; color: #495057; font-size: 16px;">
                            サーバー情報
                        </h3>
                        
                        <!-- プロファイル名 -->
                        <div style="margin-bottom: 20px;">
                            <label style="
                                display: block;
                                margin-bottom: 8px;
                                color: #6c757d;
                                font-size: 13px;
                                font-weight: 500;
                            ">
                                プロファイル名（任意）
                            </label>
                            <input type="text" id="newProfileName" placeholder="例: 楽天RMS本番サーバー" style="
                                width: 100%;
                                padding: 12px 15px;
                                border: 1px solid #dee2e6;
                                border-radius: 8px;
                                font-size: 15px;
                                transition: border-color 0.3s;
                            " onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#dee2e6'">
                        </div>
                        
                        <!-- ホストとポート -->
                        <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                            <div style="flex: 2;">
                                <label style="
                                    display: block;
                                    margin-bottom: 8px;
                                    color: #6c757d;
                                    font-size: 13px;
                                    font-weight: 500;
                                ">
                                    ホスト名 <span style="color: #dc3545;">*</span>
                                </label>
                                <input type="text" id="newHost" placeholder="例: upload.rakuten.ne.jp" style="
                                    width: 100%;
                                    padding: 12px 15px;
                                    border: 1px solid #dee2e6;
                                    border-radius: 8px;
                                    font-size: 15px;
                                    font-family: monospace;
                                    transition: border-color 0.3s;
                                " onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#dee2e6'">
                            </div>
                            <div style="flex: 1;">
                                <label style="
                                    display: block;
                                    margin-bottom: 8px;
                                    color: #6c757d;
                                    font-size: 13px;
                                    font-weight: 500;
                                ">
                                    ポート
                                </label>
                                <input type="number" id="newPort" value="22" style="
                                    width: 100%;
                                    padding: 12px 15px;
                                    border: 1px solid #dee2e6;
                                    border-radius: 8px;
                                    font-size: 15px;
                                    font-family: monospace;
                                    transition: border-color 0.3s;
                                " onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#dee2e6'">
                            </div>
                        </div>
                        
                        <!-- ユーザー名とパスワード -->
                        <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                            <div style="flex: 1;">
                                <label style="
                                    display: block;
                                    margin-bottom: 8px;
                                    color: #6c757d;
                                    font-size: 13px;
                                    font-weight: 500;
                                ">
                                    ユーザー名 <span style="color: #dc3545;">*</span>
                                </label>
                                <input type="text" id="newUsername" placeholder="ユーザー名" style="
                                    width: 100%;
                                    padding: 12px 15px;
                                    border: 1px solid #dee2e6;
                                    border-radius: 8px;
                                    font-size: 15px;
                                    transition: border-color 0.3s;
                                " onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#dee2e6'">
                            </div>
                            <div style="flex: 1;">
                                <label style="
                                    display: block;
                                    margin-bottom: 8px;
                                    color: #6c757d;
                                    font-size: 13px;
                                    font-weight: 500;
                                ">
                                    パスワード <span style="color: #dc3545;">*</span>
                                </label>
                                <div style="position: relative;">
                                    <input type="password" id="newPassword" placeholder="パスワード" style="
                                        width: 100%;
                                        padding: 12px 40px 12px 15px;
                                        border: 1px solid #dee2e6;
                                        border-radius: 8px;
                                        font-size: 15px;
                                        transition: border-color 0.3s;
                                    " onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#dee2e6'">
                                    <button onclick="togglePasswordVisibility()" style="
                                        position: absolute;
                                        right: 10px;
                                        top: 50%;
                                        transform: translateY(-50%);
                                        background: none;
                                        border: none;
                                        cursor: pointer;
                                        font-size: 18px;
                                    ">👁️</button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- デフォルトディレクトリ -->
                        <div style="margin-bottom: 10px;">
                            <label style="
                                display: block;
                                margin-bottom: 8px;
                                color: #6c757d;
                                font-size: 13px;
                                font-weight: 500;
                            ">
                                デフォルトディレクトリ
                            </label>
                            <input type="text" id="newDefaultDirectory" value="/ritem" placeholder="例: /ritem" style="
                                width: 100%;
                                padding: 12px 15px;
                                border: 1px solid #dee2e6;
                                border-radius: 8px;
                                font-size: 15px;
                                font-family: monospace;
                                transition: border-color 0.3s;
                            " onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#dee2e6'">
                        </div>
                    </div>
                    
                    <!-- クイック設定 -->
                    <div style="
                        background: #e7f3ff;
                        border-left: 4px solid #667eea;
                        border-radius: 8px;
                        padding: 15px;
                        margin-bottom: 20px;
                    ">
                        <h4 style="margin: 0 0 10px 0; color: #495057; font-size: 14px;">
                            💡 クイック設定
                        </h4>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button onclick="setRakutenPreset()" style="
                                padding: 8px 15px;
                                background: white;
                                border: 1px solid #667eea;
                                color: #667eea;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 13px;
                                transition: all 0.2s;
                            " onmouseover="this.style.background='#667eea'; this.style.color='white'" 
                               onmouseout="this.style.background='white'; this.style.color='#667eea'">
                                楽天RMS
                            </button>
                            <button onclick="setRebexPreset()" style="
                                padding: 8px 15px;
                                background: white;
                                border: 1px solid #667eea;
                                color: #667eea;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 13px;
                                transition: all 0.2s;
                            " onmouseover="this.style.background='#667eea'; this.style.color='white'" 
                               onmouseout="this.style.background='white'; this.style.color='#667eea'">
                                Rebexテスト
                            </button>
                            <button onclick="setDLPTestPreset()" style="
                                padding: 8px 15px;
                                background: white;
                                border: 1px solid #667eea;
                                color: #667eea;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 13px;
                                transition: all 0.2s;
                            " onmouseover="this.style.background='#667eea'; this.style.color='white'" 
                               onmouseout="this.style.background='white'; this.style.color='#667eea'">
                                DLP FTPテスト
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- フッター -->
                <div style="
                    background: #f8f9fa;
                    padding: 20px 30px;
                    border-radius: 0 0 16px 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <button onclick="testServerConnection()" style="
                        padding: 12px 24px;
                        background: #ffc107;
                        color: #212529;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 15px;
                        font-weight: 500;
                        transition: all 0.3s;
                    " onmouseover="this.style.background='#ffb300'" onmouseout="this.style.background='#ffc107'">
                        🔍 接続テスト
                    </button>
                    
                    <div style="display: flex; gap: 10px;">
                        <button onclick="cancelAddServer()" style="
                            padding: 12px 24px;
                            background: #6c757d;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 15px;
                            font-weight: 500;
                            transition: all 0.3s;
                        " onmouseover="this.style.background='#5a6268'" onmouseout="this.style.background='#6c757d'">
                            キャンセル
                        </button>
                        <button onclick="confirmAddServer()" style="
                            padding: 12px 30px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 15px;
                            font-weight: 500;
                            transition: all 0.3s;
                            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                        " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                            ✅ サーバーを追加
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        </style>
    `;
    
    // DOMに追加
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // イベントリスナーを設定
    setupServerModalEvents();
    
    console.log('[SERVER] 改善版モーダルを作成完了');
}

/**
 * モーダルのイベントリスナーを設定
 */
function setupServerModalEvents() {
    // プロトコル切り替え
    const sftpBtn = document.getElementById('sftpProtocolBtn');
    const ftpBtn = document.getElementById('ftpProtocolBtn');
    const portInput = document.getElementById('newPort');
    
    sftpBtn.onclick = function() {
        sftpBtn.style.background = '#667eea';
        sftpBtn.style.borderColor = '#667eea';
        sftpBtn.style.color = 'white';
        sftpBtn.classList.add('active');
        
        ftpBtn.style.background = 'white';
        ftpBtn.style.borderColor = '#dee2e6';
        ftpBtn.style.color = '#495057';
        ftpBtn.classList.remove('active');
        
        portInput.value = '22';
    };
    
    ftpBtn.onclick = function() {
        ftpBtn.style.background = '#667eea';
        ftpBtn.style.borderColor = '#667eea';
        ftpBtn.style.color = 'white';
        ftpBtn.classList.add('active');
        
        sftpBtn.style.background = 'white';
        sftpBtn.style.borderColor = '#dee2e6';
        sftpBtn.style.color = '#495057';
        sftpBtn.classList.remove('active');
        
        portInput.value = '21';
    };
    
    // 閉じるボタン
    document.getElementById('closeServerModal').onclick = function() {
        document.getElementById('serverModal').style.display = 'none';
    };
}

/**
 * パスワード表示切り替え
 */
window.togglePasswordVisibility = function() {
    const passwordInput = document.getElementById('newPassword');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
    } else {
        passwordInput.type = 'password';
    }
};

/**
 * 楽天RMSプリセット
 */
window.setRakutenPreset = function() {
    document.getElementById('newProfileName').value = '楽天RMS';
    document.getElementById('newHost').value = 'upload.rakuten.ne.jp';
    document.getElementById('newPort').value = '22';
    document.getElementById('newDefaultDirectory').value = '/ritem';
    document.getElementById('sftpProtocolBtn').click();
    showToast('楽天RMSの設定を適用しました', 'info');
};

/**
 * Rebexテストプリセット
 */
window.setRebexPreset = function() {
    document.getElementById('newProfileName').value = 'Rebexテストサーバー';
    document.getElementById('newHost').value = 'test.rebex.net';
    document.getElementById('newPort').value = '22';
    document.getElementById('newUsername').value = 'demo';
    document.getElementById('newPassword').value = 'password';
    document.getElementById('newDefaultDirectory').value = '/';
    document.getElementById('sftpProtocolBtn').click();
    showToast('Rebexテストサーバーの設定を適用しました', 'info');
};

/**
 * DLP FTPテストプリセット
 */
window.setDLPTestPreset = function() {
    document.getElementById('newProfileName').value = 'DLP FTPテスト';
    document.getElementById('newHost').value = 'ftp.dlptest.com';
    document.getElementById('newPort').value = '21';
    document.getElementById('newUsername').value = 'dlpuser';
    document.getElementById('newPassword').value = 'rNrKYTX9g7z3RgJRmxWuGHbeu';
    document.getElementById('newDefaultDirectory').value = '/';
    document.getElementById('ftpProtocolBtn').click();
    showToast('DLP FTPテストの設定を適用しました', 'info');
};

/**
 * 接続テスト
 */
window.testServerConnection = async function() {
    const protocol = document.querySelector('.protocol-btn.active').id === 'sftpProtocolBtn' ? 'sftp' : 'ftp';
    const host = document.getElementById('newHost').value;
    const port = document.getElementById('newPort').value;
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    
    if (!host || !username || !password) {
        showToast('必須項目を入力してください', 'error');
        return;
    }
    
    showToast('接続テスト中...', 'info');
    
    try {
        const response = await fetch('/api/test-connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                protocol,
                host,
                port: parseInt(port),
                username,
                password
            })
        });
        
        const result = await response.json();
        if (result.success) {
            showToast('✅ 接続成功！', 'success');
        } else {
            showToast(`❌ 接続失敗: ${result.message}`, 'error');
        }
    } catch (error) {
        showToast(`❌ エラー: ${error.message}`, 'error');
    }
};

/**
 * キャンセル
 */
window.cancelAddServer = function() {
    document.getElementById('serverModal').style.display = 'none';
};

/**
 * サーバー追加を確定
 */
window.confirmAddServer = function() {
    const protocol = document.querySelector('.protocol-btn.active').id === 'sftpProtocolBtn' ? 'sftp' : 'ftp';
    const name = document.getElementById('newProfileName').value;
    const host = document.getElementById('newHost').value;
    const port = document.getElementById('newPort').value;
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const defaultDirectory = document.getElementById('newDefaultDirectory').value || '/';
    
    if (!host || !username || !password) {
        showToast('必須項目を入力してください', 'error');
        return;
    }
    
    // プロファイルを作成
    const newProfile = {
        id: Date.now(),
        name: name || `${host}:${port}`,
        protocol,
        host,
        port: parseInt(port),
        username,
        password,
        defaultDirectory
    };
    
    // 保存
    const profiles = JSON.parse(localStorage.getItem('ftpProfiles') || '[]');
    profiles.push(newProfile);
    localStorage.setItem('ftpProfiles', JSON.stringify(profiles));
    
    // グローバル変数を更新
    if (window.profiles) {
        window.profiles = profiles;
    }
    
    // UIを更新
    if (typeof updateProfileList === 'function') {
        updateProfileList();
    }
    
    showToast(`✅ サーバー「${newProfile.name}」を追加しました`, 'success');
    
    // モーダルを閉じる
    document.getElementById('serverModal').style.display = 'none';
};

/**
 * サーバー追加モーダルを開く
 */
window.openServerModal = function() {
    createImprovedServerModal();
    document.getElementById('serverModal').style.display = 'block';
};

// 初期化
console.log('[SERVER] 改善版サーバーモーダルモジュールをロード完了');