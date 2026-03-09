# ci-automation

- タイトル: Docker / 契約生成の CI 自動検証
- 責任者: Copilot
- 目的: GitHub Actions で backend・frontend・契約生成・Docker Compose 構成を自動検証し、ローカル環境差異に依存しない回帰検知を追加する。
- 進捗: review-complete, commit-pending

## 変更・作成するファイル
- 作成候補: .github/workflows/ci.yml
- 更新候補: frontend/vite.config.ts, frontend/package.json, COMMAND.md, README.md
- 必要に応じて更新候補: package.json, docs/exec-plans/completed/ci-automation.md

## 実装内容
- GitHub Actions の CI workflow を追加し、pull_request / push で backend tests、frontend build/test/coverage、root build を実行する
- OpenAPI から frontend 契約を再生成し、差分があれば CI を失敗させる
- Docker 利用可能な GitHub Actions runner 上で `docker compose config` と `docker compose build` を検証する
- frontend coverage の 80% しきい値を CI で明示的にチェックする
- README / COMMAND に CI 検証導線を追記する

## 影響範囲
- GitHub Actions
- frontend coverage 設定
- backend / frontend 契約更新時の運用
- 開発者の回帰確認手順

## 実装ステップ
- [x] 既存 workflow と既存検証コマンドを確認し、CI の責務分割を決める
- [x] frontend coverage の fail-under を CI で強制できるよう設定する
- [x] backend / frontend / root build / contract drift をまとめた workflow を追加する
- [x] Docker Compose の構成検証ジョブを追加する
- [x] README / COMMAND を CI 前提で更新する
- [x] workflow の YAML 構文と関連コマンドを検証する
- [ ] 完了後に本プランを completed へ移動する

## 注意点
- 既存の screenshot workflow を壊さずに共存させる
- 契約生成チェックは自動生成ファイルの差分のみを判定し、不要な副作用を残さない
- Docker 検証は runner 標準機能で完結する範囲に留め、長時間の統合起動は避ける
- この環境では `docker` コマンドが使えないため、Docker 構成の実行検証は GitHub Actions runner に委ねる
