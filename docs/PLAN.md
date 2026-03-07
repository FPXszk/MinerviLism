## Devinit tmux environment improvements (2026-03)

目的:
WSL + tmux + Copilot CLI 開発環境の安定性・操作性を改善する

対象ファイル:
devinit.sh

実装タスク:

1. tmux 基本設定の追加
   - mouse on
   - aggressive-resize on
   - history-limit 50000
   - remain-on-exit on

2. Copilot pane を初期フォーカスに設定

3. logs pane を multitail 対応

4. backend 自動再起動ループ追加

5. frontend 自動再起動ループ追加

6. git pane 起動ログ追加

7. tmux セッション健全性チェック強化
   - window name validation

8. TERM 環境変数追加
   - xterm-256color

sudo apt install multitail
