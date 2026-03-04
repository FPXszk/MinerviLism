# 📘 COMMAND.md
Invest プロジェクト コマンド一覧

---

# Backtest Dashboard (Web UI)

## 🚀 開発環境での起動
複数のターミナルを開いて以下を実行してください（順番は関係ありません）

### ターミナル1：バックエンドAPI起動
```powershell
cd C:\00_mycode\Invest\python
.\.venv\Scripts\Activate.ps1
cd C:\00_mycode\Invest\backend
python -m uvicorn app:app --reload --port 8000
```
- API サーバーは http://localhost:8000 で起動します
- ホットリロード対応

### ターミナル2：フロントエンド開発サーバー起動
```powershell
cd C:\00_mycode\Invest\python
.\.venv\Scripts\Activate.ps1
cd C:\00_mycode\Invest\frontend
npm run dev
```
- React アプリは http://localhost:3000 で起動します
- ホットリロード対応

## 🌐 ブラウザでアクセス
```
http://localhost:3000/dashboard
```

## 🧪 API エンドポイントテスト
```powershell
# 最新のバックテスト結果を取得
curl http://localhost:8000/api/backtest/latest

# 利用可能なバックテスト一覧を取得
curl http://localhost:8000/api/backtest/list

# 特定のタイムスタンプの結果を取得
curl http://localhost:8000/api/backtest/results/20260303-221229
```

## 📊 ダッシュボード機能
- **サイドバー**: バックテスト実行履歴の一覧表示
- **Summary タブ**: 統計情報（勝率、損益、シャープレシオなど）
- **Charts タブ**: 上位5銘柄・下位5銘柄のチャート表示（クリックで拡大）
- **Trades タブ**: 全トレード詳細テーブル（ソート・ページネーション対応）

## 🐛 デバッグ・トラブルシューティング

### ブラウザ開発者ツール
```
http://localhost:3000/dashboard で F12 キーを押す
- Console タブで JavaScript エラーを確認
- Network タブで API リクエスト/レスポンスを確認
```

### API ステータス確認
```powershell
# バックエンドが起動しているか確認
curl http://localhost:8000/health

# 特定の API エンドポイントが動作しているか確認
curl -i http://localhost:8000/api/backtest/list
```

### フロントエンドログ確認
ターミナル2（npm run dev）を見て、以下のようなエラーがないか確認：
```
[VITE] error: ...
```

### キャッシュのクリア
```powershell
# Python キャッシュ削除
cd python
Remove-Item -Recurse __pycache__
Remove-Item -Recurse .pytest_cache

# Node.js キャッシュ削除
cd frontend
npm cache clean --force
Remove-Item -Recurse node_modules
npm install
```

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
# 環境構築
pip install -r requirements.txt
# 仮想環境起動
.venv\Scripts\Activate.ps1
```

---

# テスト実行

```powershell
# 全テスト実行
pytest
# 特定のテスト
pytest tests/test_ticker_fetcher_smoke.py -v
# カバレッジ付き
pytest --cov=. --cov-report=html
```

---
# Pythonデバックコマンド
# 銘柄リスト更新

```powershell
python scripts/update_tickers_extended.py
# オプション指定
python scripts/update_tickers_extended.py --min-market-cap 5000000000
python scripts/update_tickers_extended.py --min-market-cap 5000000000 --max-tickers 2000
```

# Stage2 スクリーニング
```powershell
python main.py --mode stage2
python main.py --mode stage2 --with-fundamentals

# # クイックテスト
# python main.py --mode test
# # Stage2 + VCP
# python main.py --mode full
```

#　Backtest　+ 自動チャート生成
```powershell
# デフォルト期間
python main.py --mode backtest
# 期間指定
python main.py --mode backtest --start 2023-01-01 --end 2024-01-01
python main.py --mode backtest --start 2022-01-01 --end 2024-12-31
# 特定銘柄のみ
python main.py --mode backtest --tickers AAPL,MSFT,NVDA
## チャート生成スキップ
python main.py --mode backtest --no-charts
## 特定銘柄チャート生成
python main.py --mode chart --ticker AAPL
## 期間指定チャート
python main.py --mode chart --ticker AAPL --start 2023-01-01 --end 2024-01-01
# フォールバック動作テスト
ログ内の `[FALLBACK]` を確認
```