# WSL 用互換性チェック手順

このファイルは、WSL (Ubuntu など) 上で本プロジェクトを動かす際に互換性で注意すべき点と、実行して確認するコマンド群をまとめたものです。

## 目的
- WSL にインストールされたツールやライブラリが、プロジェクトの要件と乖離していないかをチェックする。
- 必要なシステムライブラリが不足している場合に備え、手順を提示する。

## まずやってほしいチェック（WSLで実行）
```bash
# 作業ディレクトリ
cd /mnt/c/00_mycode/Invest

# 環境情報の自動収集スクリプト（./scripts/wsl_env_check.sh を作成済）を実行
bash ./scripts/wsl_env_check.sh

# 直接確認したいコマンド
python3 --version
python3 -m pip --version
python3 -m pip freeze | sed -n '1,200p'
node --version
npm --version
npm ls --depth=0
```

## システム依存が疑われる主な Python パッケージ
- lxml: libxml2-dev / libxslt1-dev が必要
- mplfinance / matplotlib（コメントアウト済の場合は不要）: libfreetype6-dev / libpng-dev が必要な場合あり
- uvicorn[standard]: extras に依存するネイティブ拡張があるためビルドツールや互換性に注意

### apt で入れておくと良いもの（Ubuntu系）
```bash
sudo apt update && sudo apt install -y build-essential python3-dev python3-venv libxml2-dev libxslt1-dev pkg-config libfreetype6-dev libpng-dev libssl-dev
```

## Node / npm 側の注意点
- Electron を WSL 上で動かす場合は X11/Wayland 環境やディスプレイ転送が必要になるため別途検討が必要。
- Node の推奨バージョンはプロジェクトに明示されていませんが、devDependencies の一部は最新の Node を想定するため v18 以上を推奨します。

## 次のアクション
1. `bash ./scripts/wsl_env_check.sh` を実行して生成された `wsl_env_report.txt` を確認してもらえれば、こちらで差分を解析して互換性問題を洗い出します。
2. 必要であれば、報告に基づいて `requirements.txt` の固定や `package.json` の engines 指定、あるいは Docker 化の提案を行います。

