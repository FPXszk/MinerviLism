# 改善提案の実装計画

## 変更・削除・作成するファイル
- frontend/src/pages/BacktestDashboard.test.tsx ほか frontend テスト群
- frontend/src/hooks/useActiveJob.ts と関連 hook/component テスト
- frontend/src/components/CandlestickChart.tsx
- frontend/src/components/TopBottomPurchaseChart.tsx
- frontend/src/components/TopBottomPurchaseCharts.tsx
- frontend/vite.config.ts と必要に応じた frontend package 設定
- scripts/check_docs.py
- scripts/doc_gardening.py
- tests/test_doc_governance.py
- README.md / COMMAND.md / docs/QUALITY_SCORE.md / docs/DOCUMENTATION_SYSTEM.md など関連ドキュメント
- docs/exec-plans/active/improvement-round-1.md

## 実装内容
1. frontend test 実行時の React act warning を再現する失敗テストを追加し、warning の原因箇所を修正する
2. doc lint に、ドキュメントから参照している主要コマンドや docs 入口/索引整合性など未検証項目を追加する
3. Plotly を初期描画から分離するため、必要コンポーネントを lazy load / dynamic import 化し、bundle 出力を改善する
4. doc-gardening が安全に自動更新できる generated/index 系ファイルを拡張し、CI と運用ドキュメントへ反映する

## 影響範囲
- frontend のテスト実行安定性
- frontend build の chunk 構成と初期読み込み性能
- docs governance スクリプト、CI、定期 PR 自動生成
- README/COMMAND/QUALITY_SCORE の運用説明

## 実装ステップ
- [x] act warning を再現するテストを追加して失敗を確認する
- [x] warning 原因の state update / timer / event 処理を修正して frontend テストを通す
- [x] doc lint 拡張用の失敗テストを追加する
- [x] scripts/check_docs.py と関連 docs を更新して検証項目を増やす
- [x] Plotly 分割用の失敗テストまたは build 検証を追加する
- [x] frontend 側の Plotly 利用箇所を分離し、build/test で回帰確認する
- [x] doc-gardening 拡張用の失敗テストを追加する
- [x] scripts/doc_gardening.py / workflow / docs を更新して自動修正範囲を広げる
- [x] 関連テストと build を再実行し、必要に応じてレビューに進む
