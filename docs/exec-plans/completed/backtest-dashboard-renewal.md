# 実装計画: バックテスト・ダッシュボード改善

- タイトル: バックテスト・ダッシュボード改善
- 責任者: Copilot
- 目的: バックテスト UI を実行・管理系の別ルートと解析・結果系の別ルートに分離し、チャート表示を簡素化しつつ、トレード履歴を日本語化・モバイル最適化する。
- 進捗: review-complete, commit-pending

## 変更・作成するファイル
- 更新候補: `frontend/src/App.tsx`, `frontend/src/components/CandlestickChart.tsx`, `frontend/src/components/TradeTable.tsx`, `frontend/src/locales/ja.json`, `frontend/src/locales/en.json`
- 更新候補: `frontend/src/pages/BacktestDashboard.tsx`, `frontend/src/pages/BacktestDashboard.test.tsx`, `frontend/src/pages/BacktestDashboard.e2e.test.tsx`, `frontend/src/components/CandlestickChart.test.tsx`, `frontend/src/components/TradeTable.test.tsx`
- 作成候補: `frontend/src/pages/BacktestRunPage.tsx`, `frontend/src/pages/BacktestAnalysisPage.tsx`, 共有 state / layout 用の補助ファイル
- 必要に応じて更新: バックテスト関連の共通コンポーネント、関連する E2E / 統合テスト

## 実装内容
- `/dashboard` をデフォルトで実行・管理画面へリダイレクトし、`/dashboard/run` と `/dashboard/analysis` の別ルート構成へ再編する。
- 既存 `BacktestDashboard` の状態管理を共有レイアウトまたは共有 hook に切り出し、実行・管理画面と解析・結果画面の両方で同じ backtest 選択状態・ジョブ状態・結果状態を共有できるようにする。
- 実行・管理画面にはコマンドランナー、利用可能なテスト一覧、固定した年次結果、実行ログを集約する。
- 解析・結果画面にはサマリー、チャート、トレード履歴を集約する。
- `CandlestickChart` から「拡大画像」「詳細を開く」導線とモーダル関連ロジックを削除し、標準サイズ表示のみに整理する。
- `TradeTable` に終了理由の日本語ラベル変換とモバイル向けレイアウト調整を追加し、横スクロール依存を緩和する。
- 変更に合わせて既存テストを更新し、必要な UI テストを追加する。

## 影響範囲
- フロントエンドのルーティングとバックテスト導線
- BacktestDashboard 系ページの状態共有
- チャート表示 UX
- トレード履歴のレスポンシブ UI と i18n
- 関連ユニットテスト / E2E テスト

## 実装ステップ
- [x] 現行のルーティング、BacktestDashboard、チャート、トレード履歴の構造を調査する
- [x] 共有 state の置き場所を決め、`/dashboard/run` と `/dashboard/analysis` のルーティング構成を設計する
- [x] 実行・管理画面と解析・結果画面を分離し、`/dashboard` のデフォルト遷移を実装する
- [x] `CandlestickChart` の拡大表示系 UI を削除して標準表示へ整理する
- [x] `TradeTable` の終了理由表示とモバイル UI を改善する
- [x] 関連テストを更新・追加し、frontend の既存検証コマンドで確認する

## 注意点
- 別ルートに分けても、backtest 選択状態やジョブ状態が route 遷移で不意に失われない構成を優先する
- チャート簡略化では、既存の期間切替や年次切替など必要な操作を誤って削除しない
- 終了理由の日本語化は raw 値を直接埋め込まず、i18n キーや明示的マッピングで管理する
- モバイル最適化は単なる縮小ではなく、視認性と情報優先度の両立を確認する
