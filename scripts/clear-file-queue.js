const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function backup(src) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dst = `${src}.backup.${stamp}`;
  fs.copyFileSync(src, dst);
  return dst;
}

function main() {
  const dbPath = path.join(__dirname, '..', 'data', 'database.db');
  if (!fs.existsSync(dbPath)) {
    console.error('Database not found:', dbPath);
    process.exit(1);
  }

  const backupPath = backup(dbPath);
  const db = new Database(dbPath);
  try {
    const before = db.prepare('SELECT COUNT(*) AS c FROM file_queue').get().c;
    db.exec('BEGIN');
    db.exec('DELETE FROM file_queue;');
    db.exec('COMMIT');
    const after = db.prepare('SELECT COUNT(*) AS c FROM file_queue').get().c;
    console.log(JSON.stringify({ ok: true, backup: path.basename(backupPath), before, after }));
  } catch (e) {
    try { db.exec('ROLLBACK'); } catch {}
    console.error(JSON.stringify({ ok: false, error: e.message }));
    process.exit(1);
  } finally {
    db.close();
  }
}

main();

