# 60日データ保持制限（厳格版）

## 実装内容

### 1. フロントエンド（index.html）
- **60日以上古いデータは自動削除**
- ステータスに関係なくすべて削除
- 削除基準：scheduledTimeまたはcreatedAtが60日以前

```javascript
const sixtyDaysAgo = new Date();
sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

// 60日以上古いタスクはステータスに関係なく削除
const taskDate = task.scheduledTime || task.createdAt;
if (taskDate && taskDate < sixtyDaysAgo) {
    return false; // 削除
}
```

### 2. サーバー側（sftp-server.js）

#### 起動時クリーンアップ
- サーバー起動時に60日以上古いファイルを削除
- データの整合性を保証

#### 定期クリーンアップ（1日1回）
- 60日以上古いファイルを削除
- expiresAtが過ぎたファイルも削除

```javascript
const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
if (fileDate < sixtyDaysAgo || new Date(metadata.expiresAt) < now) {
    // 削除
}
```

## データ保持ルール

| 期間 | 処理 |
|------|------|
| 0-60日 | 保持 |
| 60日超 | 自動削除（全データ） |

## クリーンアップタイミング

1. **フロントエンド**
   - ページ読み込み時
   - LocalStorage読み込み時

2. **サーバー側**
   - サーバー起動時
   - 24時間ごと（定期実行）

## メリット
- ディスク容量の効率的な利用
- パフォーマンスの維持
- 古いデータによる混乱を防止