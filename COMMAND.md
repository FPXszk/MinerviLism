# 📘 COMMAND.md
Invest プロジェクト コマンド一覧

---

# Electron / Frontend 関連

## 開発起動

```bash
npm run tsc:watch
npm run renderer:dev
npm run electron:dev
```

## 製品版相当の確認

```bash
npm run start:prod
```

## ビルド

```bash
npm run build
```

※ `renderer-dist/` が生成される

## release削除

```bash
cmd /c rmdir /s /q release
```

## インストーラー生成

```bash
npm run dist
```

---

# Python 環境セットアップ

```powershell
cd C:\00_mycode\Invest\python

# 仮想環境作成（初回のみ）
python -m venv venv

# 仮想環境起動
.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

---

# テスト実行

```powershell
cd C:\00_mycode\Invest\python

# 全テスト実行
pytest

# 特定のテスト
pytest tests/test_ticker_fetcher_smoke.py -v

# カバレッジ付き
pytest --cov=. --cov-report=html
```

---

# 銘柄リスト更新

```powershell
python scripts/update_tickers_extended.py

# オプション指定
python scripts/update_tickers_extended.py --min-market-cap 5000000000 --max-tickers 2000
```

---

# Stage2 スクリーニング

```powershell
# Stage2抽出
python main.py --mode stage2

# クイックテスト
python main.py --mode test

# Stage2 + VCP
python main.py --mode full
```

---

# ファンダメンタルズ付きスクリーニング

```powershell
python main.py --mode stage2 --with-fundamentals
```

---

# バックテスト実行

## 正しいワークフロー

```powershell
# Step1 Stage2
python main.py --mode stage2

# Step2 Backtest
python main.py --mode backtest --start 2023-01-01 --end 2024-01-01
```

## その他オプション

```powershell
# デフォルト期間
python main.py --mode backtest

# 期間指定
python main.py --mode backtest --start 2022-01-01 --end 2024-12-31

# 特定銘柄のみ
python main.py --mode backtest --tickers AAPL,MSFT,NVDA
```

---

# チャート生成

## バックテスト + 自動チャート生成

```bash
python main.py --mode backtest
```

## チャート生成スキップ

```bash
python main.py --mode backtest --no-charts
```

## 特定銘柄チャート生成

```bash
python main.py --mode chart --ticker AAPL
```

## 期間指定チャート

```bash
python main.py --mode chart --ticker AAPL --start 2023-01-01 --end 2024-01-01
```

---

# Stage2 手動テスト

```bash
python scripts/update_tickers_extended.py
python main.py --mode stage2
python main.py --mode backtest --start 2023-01-01 --end 2024-01-01
```

---

# 特定銘柄デバッグ

```bash
python scripts/debug_stage2.py AAPL
```

---

# フォールバック動作テスト

```bash
python main.py --mode backtest --start 2022-01-01 --end 2022-12-31
```

ログ内の `[FALLBACK]` を確認