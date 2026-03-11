# 実装計画: モバイルUI改善と著名トレーダー戦略拡張

- フェーズ: localhost 可視化改善 Phase 2
- プラン: モバイルUI改善と著名トレーダー戦略拡張
- 責任者: Copilot
- 目的: スマートフォンでの操作性と可読性を改善しつつ、固定年次結果表示・チャート拡大・著名トレーダー導線・Python 側の独立戦略実装を追加する。
- issue 連携: `#59 Improve localhost visualization iteration 2` のうち、今回依頼と重なる UX / モバイル可読性 / チャート説明 / テスト強化を同時対応対象とする。
- 進捗: planning

## 前提
- 著名トレーダー戦略は、実在投資家の売買を完全再現するものではなく、公開情報から抽出した特徴を元にした trader-inspired ルールとして Python 側へ実装する。
- 初期の人物候補は `Warren Buffett` / `George Soros` / `Peter Lynch` / `Mark Minervini` / `Ray Dalio` を想定し、承認後に必要なら差し替える。
- `backend/services/result_store.py` には 2020-2025 年次 pinned period の既存実装があり、2020年/2021年 run ディレクトリも現ワークツリーに存在する。

## 変更・作成するファイル
- 更新候補: `frontend/src/pages/BacktestDashboard.tsx`, `frontend/src/pages/BacktestRunPage.tsx`, `frontend/src/pages/BacktestAnalysisPage.tsx`, `frontend/src/App.tsx`, `frontend/src/App.css`, `frontend/src/styles/dashboard-cards.css`
- 更新候補: `frontend/src/components/RunPanel.tsx`, `frontend/src/components/ExperimentListTable.tsx`, `frontend/src/components/BacktestSummary.tsx`, `frontend/src/components/BacktestVisualizationPanel.tsx`, `frontend/src/components/ChartGallery.tsx`, `frontend/src/components/TopBottomPurchaseCharts.tsx`
- 更新候補: `frontend/src/hooks/useBacktestDashboardState.ts`, `frontend/src/api/backtest.ts`, `frontend/src/i18n.ts`, `frontend/src/locales/ja.json`, `frontend/src/locales/en.json`
- 追加候補: `frontend/src/pages/TraderStrategiesPage.tsx`, `frontend/src/pages/TraderStrategiesPage.test.tsx`, `frontend/src/components/ExperimentListTable.test.tsx`, `frontend/src/components/BacktestVisualizationPanel.test.tsx`, 必要な補助 component / hook / utility
- 更新候補: `python/main.py`, `python/config/params.yaml`, `python/backtest/engine.py`, `python/backtest/entry_condition.py`, `python/backtest/state_conditions.py`, `python/experiments/models.py`, `python/experiments/store.py`
- 追加候補: `python/backtest/exit_condition.py`, `python/tests/backtest/test_entry_condition_strategies.py`, `python/tests/backtest/test_exit_condition.py`, 戦略共通 helper が必要な場合の小さな module
- 変更候補: `backend/api/backtest.py`, `backend/services/result_store.py`, `backend/schemas/backtest.py`, `backend/tests/test_backtest_api.py`, `backend/tests/test_result_store.py`
- 更新候補: `docs/design-docs/STRATEGY.md`, 必要に応じて `README.md`, `ARCHITECTURE.md`, 関連テスト/設計ドキュメント

## 実装内容
- 1. Run & Manage 画面のフォーム密度を下げ、入力可能項目を視覚強調し、スマホでの誤操作を減らす。
- 2. 概要/KPI/実験一覧/チャート周辺の横はみ出しを解消し、スマホ幅で確実に収まるカード/グリッド構成へ寄せる。
- 3. シグナルイベント可視化に説明文を追加し、スマホでは重なりを避ける代替表示（一覧/集約/マーカー縮小）を導入する。
- 4. 2020年/2021年の年次結果を固定表示し、データ欠損や描画不能時は理由を UI で明示する。
- 5. チャート画像を全画面で拡大閲覧できる lightbox 体験を整え、タップ操作を最適化する。
- 6. Python 側に 5 つの trader-inspired 戦略を追加し、entry/exit/state 条件を戦略別に切り替えられるようにする。
- 7. dashboard 配下に独立した「著名トレーダー・ストラテジー」タブを追加し、人物選択、手法概要、戦略別結果表示を実装する。
- 8. issue #59 と重なる観点として、モバイル比較導線、チャート説明、関連テスト強化を同バッチで回収する。

## 影響範囲
- `/dashboard/run` の入力フォーム、実行導線、ログ表示
- `/dashboard` および `/dashboard/analysis` のカード配置、実験一覧、時系列チャート表示
- バックテスト結果選択/固定表示ロジックとチャート閲覧導線
- Python バックテスト engine / entry / exit / manifest / config
- backend の strategy 別取得 API、frontend ルーティング、i18n、既存テスト群
- 設計/仕様ドキュメントと検証コマンド

## 実装ステップ
### Task 1: 事前確認と RED 準備
- [ ] 変更対象 component / API / output / strategy pipeline の現状を精査し、2020/2021 run の displayable 条件を確認する
- [ ] モバイルUI崩れ・固定表示・著名トレーダータブ・戦略切替に対する失敗テストを追加する

### Task 2: Run 画面とダッシュボードのモバイル最適化
- [ ] `RunPanel` のレイアウト、余白、ボタンサイズ、ログ表示をスマホ向けに再設計する
- [ ] ユーザー入力欄を枠線・背景・補助文で強調し、編集可能項目を明確化する
- [ ] KPI / 条件比較 / 実験一覧 / チャートセクションの width, overflow, grid を見直す
- [ ] スマホでの実験一覧は必要に応じてカード/省略表示へ切り替える

### Task 3: 可視化改善と固定年次結果
- [ ] シグナルイベントの説明文またはツールチップ文言を追加する
- [ ] スマホ時の重なり対策としてマーカー縮小 + リスト/集約表示を導入する
- [ ] 2020/2021 を固定表示する UI と読み込み導線を追加する
- [ ] 読み込めない場合は欠損理由・対象期間を通知する
- [ ] 画像チャートの全画面拡大表示をタップ中心で使いやすくする

### Task 4: Python 側の著名トレーダー戦略追加
- [ ] `python/config/params.yaml` と `python/main.py` に strategy 選択と metadata 伝播を追加する
- [ ] `python/backtest/entry_condition.py` / `state_conditions.py` を戦略別に拡張する
- [ ] `python/backtest/exit_condition.py` を新設し、戦略ごとの exit ルールを追加する
- [ ] `python/backtest/engine.py` を最小変更で strategy-aware にし、既存 pipeline の再利用を優先する

### Task 5: strategy 別 API と新規タブ
- [ ] backend に strategy 別 run 取得導線を追加し、frontend で利用可能な契約にする
- [ ] 新規 route/tab を追加する
- [ ] 5名分の人物アイコン、手法説明、strategy 別結果表示 UI を実装する
- [ ] Run/Analysis 既存画面との整合性を保ちながら trader tab を独立動作させる

### Task 6: REFACTOR・検証・文書同期
- [ ] 関連 component/hook/strategy helper の責務を整理し、重複スタイルと重複ロジックを共通化する
- [ ] `pytest backend/tests -q`、必要な `pytest python/tests/...`、`npm --prefix frontend run test:coverage`、`npm run test:e2e`、`npm run build` を実行して回帰確認する
- [ ] 必要なドキュメント更新後に `python scripts/doc_gardening.py && python scripts/check_docs.py` を実行する

## 注意点
- 実在投資家の戦略名を使うが、説明は「inspired by」であることを UI/ドキュメントに明記し、誤認を避ける。
- 2020年/2021年の pinned run は存在しても artifact 欠損の可能性があるため、UI 側で失敗理由を露出できるようにする。
- issue #59 の未着手項目（高度な run 比較、分布チャート追加、CI 強化など）は本バッチでは直接対象外とし、必要なら後続計画へ切り出す。
- 戦略追加時も look-ahead 禁止と既存 backtest pipeline の再利用を守り、巨大ファイル化を避ける。
