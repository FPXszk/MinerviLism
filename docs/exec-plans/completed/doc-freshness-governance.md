# 実装計画: ドキュメント整合性監査と鮮度維持の自動化

- タイトル: ドキュメント整合性監査と鮮度維持の自動化
- 責任者: Copilot
- 目的: Qiita 記事が意図する「地図としてのドキュメント構造」と「ドキュメント陳腐化の自動検出・修正」を、このリポジトリで再現する。
- 進捗: review-complete, commit-pending

## 変更・作成するファイル
- 更新候補: README.md, ARCHITECTURE.md, docs/QUALITY_SCORE.md, docs/design-docs/index.md, docs/product-specs/index.md
- 作成候補: docs/DOCUMENTATION_SYSTEM.md, scripts/check_docs.py, scripts/doc_gardening.py, .github/workflows/docs-governance.yml
- 必要に応じて更新: COMMAND.md, .github/workflows/ci.yml, docs/generated/*

## 実装内容
- 現行 docs 構造と Qiita 記事の意図を比較し、足りない導線や説明不足を補う
- ドキュメント構造を説明する中核ドキュメントを整備し、README / ARCHITECTURE から参照可能にする
- 索引ファイル、参照パス、主要コマンド・workflow の整合性を検証するドキュメントリンターを追加する
- push / pull_request / schedule で動く doc governance workflow を追加し、定期的な doc-gardening PR 作成フローを組み込む
- 運用ルールを関連ドキュメントへ反映する

## 影響範囲
- ドキュメント構造と参照導線
- GitHub Actions の CI / 定期実行
- 開発者のドキュメント更新フロー

## 実装ステップ
- [x] Qiita 記事の意図と現行 docs 構造を比較し、差分を整理する
- [x] 必要なドキュメントを修正・追加し、段階的開示の導線を整える
- [x] ドキュメント整合性チェッカーを実装し、既存 CI へ組み込む
- [x] 定期実行の doc-gardening workflow を追加し、自動 PR 作成フローを整える
- [x] README / QUALITY_SCORE / COMMAND などに運用方法を反映する
- [x] 関連テスト・検証を実行する
- [ ] 完了後に本プランを completed へ移動する

## 注意点
- docs は索引中心の構造を維持し、単一巨大ドキュメントへ寄せない
- 自動修正対象は機械的に検出・修正できる内容に限定する
- schedule 実行の副作用は PR 作成に閉じ、main へ直接 push しない
