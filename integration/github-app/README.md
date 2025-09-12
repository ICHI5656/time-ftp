GitHub App Org-wide Auto-PR (External Codex Server)

このフォルダは、外部のCodexサーバーからGitHub Appトークンで「組織内の複数リポジトリへ自動修正PR」を作成する最小スクリプト一式です。

概要
- 認証: GitHub App（組織にインストール、All repositories もしくは対象リポ選択）
- 実行: 外部サーバー上の Node.js 18+
- 対象: 組織全体（フィルタで限定可能）
- 安全性: デフォルトは dry-run。`--execute` を付けるまで書き込みなし

事前準備
1) GitHub App を組織に作成・インストール
- 必須権限:
  - Metadata: Read-only
  - Contents: Read and write
  - Pull requests: Read and write
- （任意）Checks/Actions/Issues は必要に応じて
- App ID / Installation ID を控え、Private Key（.pem）をダウンロード

2) 外部サーバー（Codex 実行環境）に環境変数を設定
- `GITHUB_APP_ID`: App ID（数値）
- `GITHUB_APP_INSTALLATION_ID`: Installation ID（数値）
- `GITHUB_APP_PRIVATE_KEY`: ダウンロードした `.pem` の中身（-----BEGIN PRIVATE KEY----- 含む複数行）

3) 依存のインストール
```
cd integration/github-app
npm ci
```

使い方
- Dry-run（変更なしで計画のみ表示）
```
node create-pr.mjs \
  --org <your-org> \
  --include ".*" \
  --title "chore: codex auto fix" \
  --message "chore: apply automated fix" \
  --path ".github/.keep" \
  --content "Managed by Codex" \
  --label "codex-auto"
```

- 実行（本当にコミット＆PR作成）
```
node create-pr.mjs \
  --org <your-org> \
  --include "^(svc-|web-)" \
  --title "chore: codex auto fix" \
  --message "chore: apply automated fix" \
  --path ".github/.keep" \
  --content "Managed by Codex" \
  --label "codex-auto" \
  --execute
```

主な引数
- `--org`: 対象のOrganization名（必須）
- `--include`: 対象リポ名の正規表現（デフォルト `.*`）
- `--exclude`: 除外リポ名の正規表現（任意）
- `--path`: 変更するファイルパス（例 `.github/.keep`）
- `--content`: そのファイルに入れる内容（Base64化は不要）
- `--title`: PRタイトル
- `--message`: コミットメッセージ
- `--label`: 付与するラベル（存在しない場合は作成試行）
- `--branch`: 作成するブランチ名（デフォルト `codex/auto-fix-<ymd>`）
- `--execute`: これを付けると実行（書き込み）

何を変更するの？
- デフォルト実装は「指定パスのファイルをブランチ上に作成/更新」→ PR 作成
- 実際の自動修正ロジックに置き換えたい場合は、`applyFixForRepo()` を編集してください
  - 例: `package.json` のスクリプト追加、ESLint 設定の投入 など

ベストプラクティス
- まずは `--include` で少数の検証用リポに限定し、`--execute` なしで dry-run
- ブランチ保護: 必須チェック（CI）を有効化し、マージ前にレビュー/テストを通す
- レート制限: 大規模Orgでは段階実行（`--include` を段階的に）
- 監査・ロギング: サーバー側で出力ログを保存

トラブルシュート
- 403/権限エラー: App 権限とインストール対象リポ範囲を確認
- PRが作れない: 既に同名ブランチ/同一変更のPRが存在しないか確認
- Private Key 読み込み: 改行を含むPEMをそのまま環境変数に（エスケープ不要）。難しければBase64化→実行時に復号

---
このスクリプトは最小構成です。必要に応じて Webhook や並列実行のチューニング（p-limit等）を追加してください。
