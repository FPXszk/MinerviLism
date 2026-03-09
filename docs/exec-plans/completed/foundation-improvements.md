# foundation-improvements

- タイトル: 基盤改善一式の実装
- 責任者: Copilot
- 目的: Electron build の再整備、Python -> API -> frontend の契約明確化、結果ストア導入、Docker 化、E2E / 契約テスト追加をまとめて実施し、再現性と保守性を底上げする。
- 進捗: review-complete, commit-pending

## 変更・削除・作成するファイル
- 更新候補: package.json, tsconfig.json, electron-launcher.js, justfile, README.md, COMMAND.md
- 作成候補: docker-compose.yml, Dockerfile.backend, Dockerfile.frontend, .dockerignore
- 更新候補: backend/app.py, backend/api/backtest.py, backend/api/jobs.py, backend/services/result_loader.py
- 作成候補: backend/services/result_store.py, backend/tests/test_result_store.py, backend/tests/test_openapi_contract.py
- 更新候補: frontend/src/api/backtest.ts, frontend/src/api/jobs.ts, frontend/src/components/ または pages/ の API 利用箇所
- 作成候補: frontend/src/api/generated/ または shared-contracts/, tests/e2e/, Playwright 関連設定
- 作成候補: docs/exec-plans/completed/foundation-improvements.md

## 実装内容
- ルートの Electron / TypeScript 構成を整理し、少なくとも `npm run build` が通る状態へ修正する
- FastAPI の OpenAPI 契約を明示し、frontend 側で共有または生成された型を参照する構成へ寄せる
- output ディレクトリの都度走査を減らすため、結果メタデータを扱う result store / manifest 層を導入する
- Docker / Compose により backend と frontend のローカル起動導線を追加する
- Python -> API -> frontend をまたぐ E2E テスト、および出力・API の契約テストを追加する
- README / COMMAND を新構成に合わせて更新する

## 影響範囲
- ルート build、backend API、frontend API 型、テスト基盤、ローカル起動方法
- 開発者オンボーディングと再現性
- 将来の回帰検知能力

## 実装ステップ
- [x] 現状の Electron build、API 契約、結果読み込み、テスト基盤の課題を再確認する
- [x] Electron / TypeScript build を修正し、ルート build を安定化する
- [x] backend に result store / manifest 層を導入し、API 読み込みを整理する
- [x] OpenAPI ベースの契約を frontend と共有し、API クライアント型を更新する
- [x] Docker / Compose による backend / frontend 起動導線を追加する
- [x] 契約テストと E2E テストを追加する
- [x] README / COMMAND を新構成へ更新し、関連コマンドを検証する
- [ ] 完了後に本プランを completed へ移動する

## 注意点
- 既存の API 契約を不用意に壊さず、必要な変更は backend と frontend を同時に揃える
- テストは外部ネットワークに依存させず、fixture や既存 output を活用する
- Docker 化は既存の just / devinit とは別導線として追加し、現行開発フローを壊さない
- 現在の実行環境では `docker` コマンドが存在せず、Compose 実行検証のみ未完了
