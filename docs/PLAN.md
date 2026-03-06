# 開発計画（WSLネイティブ移行）

## 問題
開発リポジトリが `/mnt/c/00_mycode/Invest`（Windows filesystem）上にあり、WSL Git/ツール利用時に改行・パーミッション・パス依存の問題を誘発しやすい。  
これを `$HOME/code/Invest`（WSL Linux filesystem）へ移行し、WSLネイティブ開発に統一する。

## 実装アプローチ
1. リポジトリを WSL 側へ安全コピー（履歴保持）。
2. WSL Git の user/core 設定を確認・不足のみ設定。
3. Git 状態診断（status/remote/branch/log、差分有無）を実施。
4. リポジトリ全体を静的スキャンして Windows 依存（パス・コマンド）を抽出。
5. Python/Node/npm/vite/uvicorn/scripts の実行可能性を確認し、WSL向け修正案を整理。

## タスク
- [x] `$HOME/code` を作成し、`/mnt/c/00_mycode/Invest` を `$HOME/code/Invest` へコピーする。
- [x] 移行先で `git --version`、`git config --global user.name/email` を確認し、未設定時のみ設定する。
- [x] `git config --global core.autocrlf input` と `git config --global core.filemode false` を適用・再確認する。
- [x] 移行先で `git status` / `git remote -v` / `git branch` / `git log -5` を確認する。
- [x] 改行起因差分判定（`git diff`、`git ls-files --eol`）を確認する。
- [x] `backend` / `frontend` / `python` / `scripts` / `docs` を対象に Windows パス依存・Windows コマンド依存をスキャンする。
- [x] Python / Node / npm / vite / uvicorn / scripts のWSL適合性を診断し、必要な修正案を提示する。
- [x] 最終レポートとして、原因・再発防止設定・安全な運用手順・推奨ディレクトリ構造をまとめる。

## 影響範囲
- 変更ファイル:
  - `docs/PLAN.md`（本計画）
  - （必要時のみ）WSL対応のためのドキュメント/スクリプト更新
- 実行時影響:
  - 開発作業ディレクトリが `$HOME/code/Invest` に移る
  - Git 改行変換・fileMode 差分の発生確率を低減
  - Windows 固有パス/コマンドの残存箇所を可視化できる

## 実行結果（2026-03-06）
- コピー先は実環境に合わせて `$HOME/code/Invest`（`/home/fpxszk/code/Invest`）を使用し、source と branch/HEAD/status が一致することを確認。
- Git global 設定は user.name/user.email 設定済み、`core.autocrlf=input`, `core.filemode=false` を確認。
- 改行差分は作業中の `docs/PLAN.md` のみ。`git ls-files --eol` は `i/crlf w/crlf: 148`, `i/lf w/lf: 11`。
- Windows 依存は実装コード側（backend/frontend/python/scripts）では検出されず、主に docs の作業パス記述に `/mnt/c/...` が残存。
- 実行診断では `frontend` build/test は成功。`backend/tests/test_main_app.py` は `httpx` 未導入で失敗し、`pip install httpx` または requirements 反映が必要。

