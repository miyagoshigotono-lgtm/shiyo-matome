# 仕様カードめくり

工務店ごとの仕様情報を効率的にヒアリングするための Google Apps Script（GAS）ウェブアプリです。
スプレッドシートをデータベースとして使用し、質問マスタと工務店ごとの回答をシートで管理します。

## 構成

```
src/
├── appsscript.json  # GASプロジェクトのマニフェスト
├── Code.gs          # サーバーサイドロジック（スプレッドシート操作・Web API）
└── index.html       # クライアントサイド（画面・UI）
```

## セットアップ（clasp を使う場合）

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

## 初回セットアップ

デプロイ後、Apps Script エディタから `initializeSheets` 関数を一度実行すると、「質問」シートに初期の質問データが投入されます。

## 主な機能

- 工務店ごとに仕様ヒアリングを実施し、回答を専用シートへ自動保存
- カード形式のUIで質問を一問ずつ表示し、スライダーで自由に移動可能
- 回答内容をリアルタイムにプレビュー表示（Excel転記を想定した行数カウント付き）
- 前回の続きから再開できるセッション記録（ブラウザのlocalStorageを使用）
- 質問マスタ（カテゴリ・タイトル・通常仕様）の追加・編集・削除・並び替え
