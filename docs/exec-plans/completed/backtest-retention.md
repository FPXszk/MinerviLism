# バックテスト結果固定化の実装計画

## 変更・削除・作成するファイル
- backend/services/result_store.py
- backend/services/result_loader.py
- backend/api/backtest.py
- backend/schemas/backtest.py
- backend/tests/test_result_store.py
- backend/tests/test_openapi_contract.py
- frontend/src/api/generated/contracts.ts
- frontend/src/api/backtest.ts
- frontend/src/pages/BacktestDashboard.tsx
- frontend/src/pages/BacktestDashboard.test.tsx
- README.md / ARCHITECTURE.md / COMMAND.md（必要なら）
- docs/exec-plans/active/backtest-retention.md

## 実装内容
1. 2020-01-01 to 2025-12-31 の年次バックテストを固定対象として backend に定義する
2. 同一期間に複数 run がある場合は最新 run を canonical とし、固定対象は一覧で優先表示しつつ period 単位で重複排除する
3. API メタデータに固定化フラグや canonical 情報を載せ、frontend の一覧で固定対象が常に見えるようにする
4. 実ディレクトリは削除せず保持する前提をテストと必要最小限のドキュメントに反映する

## 影響範囲
- backtest 一覧 API と ResultStore のソート/集約ロジック
- dashboard の一覧表示順と固定表示
- OpenAPI 契約と frontend 型
- backend/frontend テスト

## 実装ステップ
- [x] 固定対象 period と canonical run 選定ルールの失敗テストを追加する
- [x] ResultStore / API schema を更新して固定化メタデータを返す
- [x] frontend 一覧を更新し、固定対象 period が見えることを検証する
- [x] backend / frontend の関連テストを再実行する

## 前提
- 2024 年のように同一 period の run が複数ある場合、最新 timestamp の run を固定対象に採用する
- 固定化は「UI から見えなくならない canonical 一覧を作る」ことを優先し、既存ディレクトリ削除は行わない
