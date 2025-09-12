const Database = require('better-sqlite3');
const path = require('path');

function main() {
  const dbPath = path.join(__dirname, '..', 'data', 'database.db');
  const db = new Database(dbPath, { readonly: true });

  const now = new Date();
  const stamp = now.toISOString();
  console.log('current_database_version_status_2025_09_13');
  console.log('timestamp:', stamp);
  
  // Basic pragmas
  const userVersion = db.pragma('user_version', { simple: true });
  const schemaVersion = db.pragma('schema_version', { simple: true });
  const foreignKeys = db.pragma('foreign_keys', { simple: true });
  console.log('pragma.user_version:', userVersion);
  console.log('pragma.schema_version:', schemaVersion);
  console.log('pragma.foreign_keys:', foreignKeys);

  // Tables overview
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('tables:', tables.map(t => t.name));

  // Inspect key tables
  const keyTables = ['ftp_connections', 'upload_schedules', 'file_queue', 'upload_history'];
  for (const t of keyTables) {
    try {
      const info = db.prepare(`PRAGMA table_info(${t})`).all();
      console.log(`table:${t}:columns:`, info.map(c => `${c.cid}:${c.name}:${c.type}:${c.notnull}`));
      const count = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get();
      console.log(`table:${t}:count:`, count.c);
    } catch (e) {
      console.log(`table:${t}:not_found`);
    }
  }

  // Presence of recently added columns
  const uploadSchedulesCols = db.prepare("PRAGMA table_info(upload_schedules)").all().map(c => c.name);
  const hasSelectedFiles = uploadSchedulesCols.includes('selected_files');
  console.log('feature.selected_files_column:', hasSelectedFiles);

  const ftpCols = db.prepare("PRAGMA table_info(ftp_connections)").all().map(c => c.name);
  const hasProtocol = ftpCols.includes('protocol');
  console.log('feature.ftp_protocol_column:', hasProtocol);

  // upload_history schedule_id nullability check (rough)
  const histCols = db.prepare("PRAGMA table_info(upload_history)").all();
  const scheduleCol = histCols.find(c => c.name === 'schedule_id');
  console.log('feature.upload_history.schedule_id.notnull:', scheduleCol ? scheduleCol.notnull : 'n/a');

  db.close();
}

main();

