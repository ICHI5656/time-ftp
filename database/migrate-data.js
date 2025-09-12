// 既存のLocalStorageデータをSQLiteに移行
const { ProfileManager, ScheduleManager, HistoryManager } = require('./database');
const fs = require('fs');
const path = require('path');

console.log('📦 既存データの移行を開始...\n');

// LocalStorageデータの移行（サーバー実行時に手動で行う）
async function migrateFromLocalStorage(localStorageData) {
    try {
        // プロファイルの移行
        if (localStorageData.ftpProfiles) {
            const profiles = JSON.parse(localStorageData.ftpProfiles);
            console.log(`📝 ${profiles.length}個のプロファイルを移行中...`);
            
            for (const profile of profiles) {
                try {
                    ProfileManager.create({
                        id: profile.id,
                        name: profile.name || profile.host,
                        host: profile.host,
                        port: parseInt(profile.port) || 21,
                        username: profile.username || '',
                        password: profile.password || '',
                        protocol: profile.protocol || 'ftp',
                        default_directory: profile.defaultDirectory || '/'
                    });
                    console.log(`  ✅ ${profile.name || profile.host}`);
                } catch (err) {
                    console.error(`  ❌ ${profile.name}: ${err.message}`);
                }
            }
        }
        
        // スケジュールの移行
        if (localStorageData.scheduledUploads) {
            const schedules = JSON.parse(localStorageData.scheduledUploads);
            console.log(`\n📅 ${schedules.length}個のスケジュールを移行中...`);
            
            for (const schedule of schedules) {
                try {
                    ScheduleManager.create({
                        id: schedule.id,
                        profile_id: schedule.profileId,
                        name: schedule.name,
                        file_path: schedule.filePath,
                        temp_file_path: schedule.tempFilePath,
                        upload_directory: schedule.uploadPath || '/',
                        schedule_type: schedule.scheduleType || 'once',
                        schedule_time: schedule.scheduledTime,
                        status: schedule.status || 'pending'
                    });
                    console.log(`  ✅ ${schedule.name}`);
                } catch (err) {
                    console.error(`  ❌ ${schedule.name}: ${err.message}`);
                }
            }
        }
        
        // アップロード履歴の移行
        if (localStorageData.uploadHistory) {
            const history = JSON.parse(localStorageData.uploadHistory);
            console.log(`\n📜 ${history.length}個の履歴を移行中...`);
            
            for (const entry of history) {
                try {
                    // プロファイルIDを探す
                    let profileId = entry.profileId;
                    if (!profileId && entry.server) {
                        const profiles = ProfileManager.getAll();
                        const profile = profiles.find(p => p.name === entry.server || p.host === entry.server);
                        profileId = profile?.id;
                    }
                    
                    if (profileId) {
                        HistoryManager.create({
                            profile_id: profileId,
                            schedule_id: entry.scheduleId || null,
                            file_name: entry.fileName,
                            file_size: entry.fileSize || 0,
                            upload_path: entry.uploadPath || '/',
                            status: entry.status === 'completed' ? 'success' : entry.status,
                            error_message: entry.error || null,
                            duration_ms: parseInt(entry.duration) || null
                        });
                    }
                } catch (err) {
                    console.error(`  ❌ 履歴エントリ: ${err.message}`);
                }
            }
        }
        
        console.log('\n✅ データ移行完了！');
        return true;
    } catch (error) {
        console.error('❌ 移行エラー:', error);
        return false;
    }
}

// JSONファイルからの移行
async function migrateFromJSON() {
    try {
        // サーバー側のスケジュールファイル
        const schedulesPath = path.join(__dirname, '../data/server-schedules.json');
        if (fs.existsSync(schedulesPath)) {
            const schedules = JSON.parse(fs.readFileSync(schedulesPath, 'utf8'));
            console.log(`\n📄 ${schedules.length}個のサーバースケジュールを移行中...`);
            
            for (const schedule of schedules) {
                try {
                    ScheduleManager.create({
                        id: schedule.id,
                        profile_id: schedule.profileId,
                        name: schedule.name,
                        file_path: schedule.filePath,
                        temp_file_path: schedule.tempFilePath,
                        upload_directory: schedule.uploadDirectory || '/',
                        schedule_type: 'server',
                        schedule_time: schedule.scheduledTime,
                        status: schedule.status || 'pending'
                    });
                    console.log(`  ✅ ${schedule.name}`);
                } catch (err) {
                    console.error(`  ❌ ${schedule.name}: ${err.message}`);
                }
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ JSONファイル移行エラー:', error);
        return false;
    }
}

// デフォルトのテストプロファイルを追加
function addDefaultProfiles() {
    console.log('\n🧪 デフォルトテストプロファイルを追加中...');
    
    const defaults = [
        {
            id: 'rebex_default',
            name: 'Rebex公開テスト',
            host: 'test.rebex.net',
            port: 22,
            username: 'demo',
            password: 'password',
            protocol: 'sftp',
            default_directory: '/'
        },
        {
            id: 'dlp_default',
            name: 'DLP公開FTPテスト',
            host: 'ftp.dlptest.com',
            port: 21,
            username: 'dlpuser',
            password: 'rNrKYTX9g7z3RgJRmxWuGHbeu',
            protocol: 'ftp',
            default_directory: '/'
        }
    ];
    
    for (const profile of defaults) {
        try {
            const existing = ProfileManager.getById(profile.id);
            if (!existing) {
                ProfileManager.create(profile);
                console.log(`  ✅ ${profile.name}`);
            } else {
                console.log(`  ⏭️ ${profile.name} (既存)`);
            }
        } catch (err) {
            console.error(`  ❌ ${profile.name}: ${err.message}`);
        }
    }
}

// エクスポート
module.exports = {
    migrateFromLocalStorage,
    migrateFromJSON,
    addDefaultProfiles
};

// 直接実行された場合
if (require.main === module) {
    (async () => {
        await migrateFromJSON();
        addDefaultProfiles();
        console.log('\n💡 ブラウザのLocalStorageデータを移行するには:');
        console.log('   1. ブラウザでコンソールを開く');
        console.log('   2. localStorage.getItem("ftpProfiles") などでデータを取得');
        console.log('   3. このスクリプトのmigrateFromLocalStorage関数に渡す');
    })();
}