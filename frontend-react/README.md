# FTP/SFTP Manager - React版

モダンなReact/TypeScript/Material-UIで構築された、エンタープライズグレードのFTP/SFTPファイル管理システムです。

## 🚀 特徴

### アーキテクチャの改善
- **モジュール化**: 単一の170KB+ HTMLファイルから、適切に分離されたReactコンポーネントへ
- **型安全性**: TypeScriptによる完全な型定義
- **状態管理**: Zustandによる効率的でシンプルな状態管理
- **UIフレームワーク**: Material-UIによる美しく一貫性のあるデザイン

### 主要機能
- 📁 **プロファイル管理**: 複数のFTP/SFTPサーバー設定を管理
- 📤 **ファイルアップロード**: ドラッグ&ドロップ対応のファイルアップロード
- 📅 **スケジュール管理**: 予約アップロードとバッチ処理
- 📊 **履歴管理**: 詳細なアップロード履歴と統計情報
- 🗄️ **データベース統合**: SQLiteによる永続的なデータ管理

## 🛠️ 技術スタック

### フロントエンド
- **React 18**: 最新のReactフレームワーク
- **TypeScript**: 型安全な開発
- **Material-UI v5**: エンタープライズUIコンポーネント
- **Zustand**: 軽量な状態管理
- **Vite**: 高速ビルドツール
- **Axios**: HTTPクライアント
- **React Dropzone**: ファイルアップロードUI

### バックエンド（既存）
- **Node.js/Express**: APIサーバー
- **SQLite**: データベース
- **ssh2-sftp-client**: SFTP接続
- **basic-ftp**: FTP接続

## 📦 インストール

### 前提条件
- Node.js 16以上
- npm または yarn
- 既存のバックエンドサーバー（sftp-server.js）が稼働中

### セットアップ手順

1. **依存関係のインストール**
```bash
cd frontend-react
npm install
```

2. **環境設定**
```bash
# .env.localファイルを作成
echo "VITE_API_URL=http://localhost:8091/api" > .env.local
```

3. **開発サーバーの起動**
```bash
npm run dev
```

4. **本番ビルド**
```bash
npm run build
npm run preview  # ビルドのプレビュー
```

## 🏗️ プロジェクト構造

```
frontend-react/
├── src/
│   ├── components/          # Reactコンポーネント
│   │   ├── ProfileManager.tsx    # プロファイル管理
│   │   ├── FileUploader.tsx      # ファイルアップロード
│   │   ├── ScheduleManager.tsx   # スケジュール管理
│   │   └── UploadHistory.tsx     # アップロード履歴
│   ├── store/               # 状態管理
│   │   └── useStore.ts          # Zustandストア
│   ├── App.tsx              # メインアプリケーション
│   └── main.tsx             # エントリーポイント
├── public/                  # 静的ファイル
├── package.json
├── tsconfig.json           # TypeScript設定
├── vite.config.ts          # Vite設定
└── README.md
```

## 🔧 コンポーネント詳細

### ProfileManager
- FTP/SFTPサーバープロファイルの作成・編集・削除
- 接続テスト機能
- プロファイルの視覚的な管理

### FileUploader
- ドラッグ&ドロップ対応
- ディレクトリブラウザ統合
- リアルタイムプログレス表示
- 複数ファイル同時アップロード

### ScheduleManager
- スケジュールの作成と管理
- 即時実行と予約実行
- ステータス追跡
- エラーハンドリング

### UploadHistory
- 詳細な履歴表示
- CSV/JSONエクスポート
- 統計情報ダッシュボード
- ページネーション対応

## 🎯 使用方法

### 1. プロファイルの作成
1. 「プロファイル管理」タブを開く
2. 「新規プロファイル」をクリック
3. サーバー情報を入力（ホスト、ポート、認証情報）
4. 「作成」をクリック

### 2. ファイルのアップロード
1. プロファイルを選択
2. 「ファイルアップロード」タブを開く
3. アップロード先ディレクトリを指定
4. ファイルをドラッグ&ドロップまたは選択
5. 「アップロード」をクリック

### 3. スケジュールの設定
1. 「スケジュール管理」タブを開く
2. 「新規スケジュール」をクリック
3. プロファイル、ファイル、実行時刻を設定
4. 「作成」をクリック

## 🔐 セキュリティ向上

### 実装済み
- TypeScriptによる型安全性
- XSS攻撃対策（React標準）
- CORS設定

### 推奨事項
- JWT認証の実装
- HTTPS通信の強制
- 暗号化されたパスワード保存
- レート制限の実装
- 監査ログの実装

## 🚀 パフォーマンス最適化

### 実装済み
- コード分割とレイジーローディング
- Zustandによる効率的な状態管理
- Viteによる高速ビルド
- Material-UIのツリーシェイキング

### 今後の最適化
- React.memoによるコンポーネント最適化
- 仮想スクロールの実装（大量データ対応）
- Service Workerによるオフライン対応
- WebSocketによるリアルタイム更新

## 📈 今後の拡張計画

### 短期目標
- [ ] ダークモード対応
- [ ] 国際化（i18n）対応
- [ ] より詳細なエラーハンドリング
- [ ] ユニットテストの追加

### 中期目標
- [ ] WebSocketによるリアルタイム進捗
- [ ] ファイル圧縮・解凍機能
- [ ] 複数ファイルの一括操作
- [ ] 高度なフィルタリングと検索

### 長期目標
- [ ] マイクロサービス化
- [ ] Kubernetes対応
- [ ] GraphQL API移行
- [ ] AI支援機能の追加

## 🐛 トラブルシューティング

### ビルドエラー
```bash
# キャッシュクリア
npm run clean
npm install
```

### API接続エラー
```bash
# バックエンドサーバーの確認
curl http://localhost:8091/api/profiles
```

### TypeScriptエラー
```bash
# 型定義の再生成
npm run type-check
```

## 📝 ライセンス

MIT License

## 👥 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を説明してください。

## 📞 サポート

問題が発生した場合は、GitHubのissueを作成してください。