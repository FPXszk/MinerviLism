# DOCUMENTATION_SYSTEM

目的
- このドキュメントは、このリポジトリの知識ベースをどの順番で読むべきか、どこに何を書くべきか、どうやって鮮度を保つかを定義する入口です。
- 大きな単一マニュアルではなく、索引から必要な深さへ進む段階的開示を前提にします。

## 読み始める順番
1. `README.md` - プロジェクト全体の概要と起動方法
2. `ARCHITECTURE.md` - レイヤ責務と配置基準
3. `docs/design-docs/index.md` - 詳細設計の索引
4. `docs/product-specs/index.md` - 仕様書の索引
5. `docs/generated/doc-inventory.md` - 実在するドキュメントと workflow の在庫表

## 正式な記録先
- ルート:
  - `README.md` - 外部向け概要
  - `ARCHITECTURE.md` - システム構造と責務
  - `COMMAND.md` - 実行コマンドの正本
- `docs/`:
  - `DESIGN.md`, `FRONTEND.md`, `PRODUCT_SENSE.md`, `QUALITY_SCORE.md`, `RELIABILITY.md`, `SECURITY.md`
  - `design-docs/` - なぜその設計にしたかを残す詳細設計
  - `product-specs/` - 期待動作と受け入れ条件
  - `exec-plans/` - 実装計画と技術的負債
  - `generated/` - 機械生成される補助ドキュメント
  - `references/` - 外部資料への参照

## 鮮度維持の仕組み
- `python scripts/check_docs.py`
  - 必須ドキュメントの存在
  - Markdown 内部リンクの破損
  - 索引ファイルと生成ドキュメントのドリフト
- `python scripts/doc_gardening.py`
  - `docs/design-docs/index.md`
  - `docs/product-specs/index.md`
  - `docs/generated/doc-inventory.md`
  を機械的に再生成
- `.github/workflows/ci.yml`
  - push / pull_request でドキュメント整合性チェックを実行
- `.github/workflows/docs-governance.yml`
  - push / pull_request で docs lint を実行
  - schedule / workflow_dispatch で doc-gardening を走らせ、差分があれば自動 PR を作成

## 運用ルール
- 実行手順を変えたら `COMMAND.md` を更新する
- レイヤ責務を変えたら `ARCHITECTURE.md` を更新する
- 設計判断を追加したら `docs/design-docs/` に記録する
- 仕様を追加したら `docs/product-specs/` に記録する
- 索引と在庫表は手で編集せず、`python scripts/doc_gardening.py` で同期する
