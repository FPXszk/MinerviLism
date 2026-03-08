## 2026-03-08 作業ログ

作業日時: 2026-03-08T14:41:00Z
作業者: 自動エージェント（Copilot）による実行ログ

### 1. 今日実装・変更した内容
- docs 以下にガバナンス文書を追加: DESIGN.md, FRONTEND.md, PRODUCT_SENSE.md, QUALITY_SCORE.md, RELIABILITY.md, SECURITY.md を作成。
- ファイル整理: docs/COMMAND.md をリポジトリルートに移動（COMMAND.md）、docs/STRATEGY.md を docs/design-docs/STRATEGY.md に移動。
- devinit.sh の start_commands() に gh 認証チェックを追加。
  - 追加行: `gh auth status >/dev/null 2>&1 || gh auth login --hostname github.com --git-protocol ssh --web`
- MCP 設定パス修正: `/mnt/c/00_mycode/Invest` -> `/home/fpxszk/code/Invest` を .mcp.json, README.md, .github/copilot-instructions.md 等の表記で統一。
- バックアップファイル削除: *.bak 系ファイルを検出して削除し、削除をコミット（例: `chore: remove backup .bak files`, commit 57a156d）。
- Git 操作: 変更は feature ブランチで行い、PR を作成して main にマージ。最終的に main を origin/main に同期（fast-forward）。

### 2. 現在のブランチ名
- main

### 3. 未完了タスク
- [ ] frontend のビルド検証（`npm --prefix frontend run build`）
- [ ] backend のテスト実行（`cd python && source .venv/bin/activate && pytest backend/tests`）
- [ ] devinit.sh の実地検証（tmux レイアウト確認、未認証時の gh auth login フロー確認）
- [ ] docs 以下に追加したガバナンス文書の内容レビューと必要な微修正
- [ ] MCP パス修正が影響する運用ドキュメントの最終チェック

### 4. 次にやるべき作業
1. CI/ローカルで以下を実行して問題を検出・修正する:
   - `npm --prefix frontend run build` とフロントのユニットテスト
   - `cd python && source .venv/bin/activate && pytest -q`（バックエンド）
2. devinit.sh を実際に起動して以下を確認する:
   - tmux の pane が期待どおりに起動すること
   - 未認証状態で起動したときに gh auth login のブラウザフローが呼ばれること（環境による）
3. ドキュメントレビュー: docs/* の文言チェックと STRATEGY.md の整合性確認
4. 不要ブランチ・タグの最終確認とリモートクリーンアップ（必要なら削除）

### 5. 重要な設計判断・方針
- ステージ分離を保持: python 側が計算を行い、backend は出力ファイルを読み取ってフロントに渡すアーキテクチャを維持。
- 未来データ参照を禁止（look-ahead 禁止）: データパイプラインの順序性と再現性を優先。
- 変更は小さく段階的に行い、各変更は対応するテストまたはスモークテストで検証する方針。
- 外部 API はテストでモックする（ネットワーク依存をテストに持ち込まない）。

### 6. 注意点（破壊してはいけない箇所・依存関係）
- devinit.sh: 開発起動フローの中心。ここを壊すと開発者の起動体験に影響するため、変更は慎重に行うこと。
- .mcp.json の path 設定: Copilot の作業ルートに直結するため誤設定するとファイル操作に問題が出る。
- docs/design-docs/STRATEGY.md: 売買ロジックの仕様書。戦略ロジックを変更する場合は必ずここを起点にすること。
- フロントエンドはビルド成果物をバックエンドやドキュメントと整合させる必要がある（フロントが計算をしない前提）。

### 7. 実行コマンド（再開時に使う/参照用）
```bash
# リポジトリを最新化
git fetch --all --prune
git checkout main
git pull --rebase origin main

# 未コミットがある場合の自動コミット手順（今回自動化スクリプトで実行）
TS=$(date -u +%Y%m%dT%H%M%SZ)
git checkout -b feature/auto-commit-${TS}
git add -A
git commit -m "chore: auto-commit pending changes before cleanup\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git push -u origin HEAD

# PR 作成／マージ（gh CLI）
gh pr create --title "Auto: commit pending changes" --body "Auto-committed local changes for cleanup." --base main --head <branch>
gh pr merge <number> --merge --delete-branch --admin --confirm

# 推奨検証コマンド
npm --prefix frontend run build
npm --prefix frontend run test -- --run
cd python && source .venv/bin/activate && pytest backend/tests -q
```

---
保存日時: 2026-03-08T14:41:00Z
作成者: Copilot
