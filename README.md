# 仕様カードめくり

工務店ごとの仕様情報を効率的にヒアリングするためのツールです。
このリポジトリには2つの版があります。

- **`src/`** … Google Apps Script（GAS）版。スプレッドシートをデータベースとして使用
- **`web/`** … 静的Webアプリ版。バックエンドを持たず、ブラウザの`localStorage`にデータを保存（Vercel/Netlifyなどにそのままデプロイ可能）

2つは見た目・操作感は同じですが、データの保存先が異なる別々のアプリとして独立しています。

## 構成

```
src/
├── appsscript.json  # GASプロジェクトのマニフェスト
├── Code.gs          # サーバーサイドロジック（スプレッドシート操作・Web API）
└── index.html       # クライアントサイド（画面・UI）

web/
└── index.html       # 静的Webアプリ版（バックエンドなし・単一HTMLファイル）

vercel.json          # Vercel用設定（web/ を公開ディレクトリに指定）
netlify.toml         # Netlify用設定（web/ を公開ディレクトリに指定）
```

---

## web/ ： 静的Webアプリ版

サーバーもデータベースも使わず、質問マスタ・工務店ごとの回答はすべてブラウザの`localStorage`に保存されます。

### 特徴・制限

- ビルド不要の単一HTMLファイル。追加のライブラリやNode.js環境は不要
- データはブラウザ単位で保存されるため、**他の人や他の端末とはデータを共有できません**（自分のPC・自分のブラウザでのみ利用する想定）
- ブラウザのキャッシュ／サイトデータを消去するとデータも失われます

### Vercelでデプロイ

1. このリポジトリをVercelにインポート
2. Framework Presetは `Other` のままでOK（リポジトリ直下の `vercel.json` が `web/` を公開ディレクトリとして自動指定します）
3. デプロイすると `https://<プロジェクト名>.vercel.app` のようなURLが発行されます

### Netlifyでデプロイ

1. このリポジトリをNetlifyにインポート
2. Build command は空欄のまま、Publish directoryは `web`（リポジトリ直下の `netlify.toml` で自動設定済み）
3. デプロイすると `https://<サイト名>.netlify.app` のようなURLが発行されます

### ローカルで試す

```
cd web
python3 -m http.server 8000
# ブラウザで http://localhost:8000 を開く
```

---

## src/ ： Google Apps Script版

工務店ごとの回答をスプレッドシートに保存し、複数人でデータを共有したい場合はこちらを使用します。

### セットアップ（clasp を使う場合）

1. [clasp](https://github.com/google/clasp) をインストールしてログイン
   ```
   npm install -g @google/clasp
   clasp login
   ```
2. 紐づけるスプレッドシート上で `拡張機能 > Apps Script` を開き、スクリプトIDを控える
3. `.clasp.json.example` を `.clasp.json` にコピーし、`scriptId` を実際の値に書き換える
   ```
   cp .clasp.json.example .clasp.json
   ```
4. コードをプッシュ
   ```
   clasp push
   ```
5. Apps Script エディタもしくは `clasp deploy` からウェブアプリとしてデプロイ

### 初回セットアップ

デプロイ後、Apps Script エディタから `initializeSheets` 関数を一度実行すると、「質問」シートに初期の質問データが投入されます。

---

## 主な機能（共通）

- 工務店ごとに仕様ヒアリングを実施し、回答を自動保存
- カード形式のUIで質問を一問ずつ表示し、スライダーで自由に移動可能
- 回答内容をリアルタイムにプレビュー表示（Excel転記を想定した行数カウント付き）
- 前回の続きから再開できるセッション記録
- 質問マスタ（カテゴリ・タイトル・通常仕様）の追加・編集・削除・並び替え
