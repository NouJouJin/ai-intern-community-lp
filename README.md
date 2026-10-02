# 農業×AIコミュニティ活動サポート（無償）募集LP

既存の学生インターン募集LP（`ai-intern-2026-lp`／ai-intern.metagri-labo.com・報酬あり）と**並行運用**する、報酬なしの体験型インターン用LPです。
作成日: 2026-10-02 ／ 作り方: 既存LPの `style.css`・計測コードをそのまま流用し、`index.html` の文面と構成だけを差し替え。

## URL（案）

- `https://community-intern.metagri-labo.com/`（`CNAME` に設定済み）
- 変更したい場合は `CNAME`、`index.html` 内の `canonical`／`og:url`／`og:image`／`twitter:image`／JSON-LD の `url` の計6か所を同じURLに揃える。

## 既存LPからの主な違い

- 報酬・契約: 「報酬なし／交通費・宿泊費なし／契約は結ばない」を冒頭・募集要項・FAQの3か所で明記
- 活動量: 週2から3時間程度・参加は任意（既存は週10時間程度・業務委託）
- 内容: 読書会・勉強会・交流会への参加と運営サポート。成果物のノルマなし
- 削除: 農業AI通信の実践事例、特定の学生インターンの声（顔写真・Instagram投稿）、5原則の評価表現、現地取材メンバー募集、有償への導線
- JSON-LD: 報酬なしのため `JobPosting` は使わず `WebPage` ＋ `FAQPage`
- `script.js`: A/B/C見出し切替（`?src=`）を無効化。GA4は同じ測定ID（G-M38LFT8GCX）で、ホスト名で区別可能

## 公開手順（GitHub Pages の場合）

1. GitHubに新規リポジトリ（例: `community-intern-lp`）を作り、このフォルダの中身を push
2. Settings → Pages → Branch: `main` / root を選択、Custom domain に `community-intern.metagri-labo.com`
3. DNS（metagri-labo.com の管理画面）に `community-intern` の CNAME レコードを追加（値: `<GitHubユーザー名>.github.io`）。既存の `ai-intern` と同じ設定を踏襲
4. Pages の「Enforce HTTPS」を有効化

## 公開前チェック

- [ ] 応募フォーム（Airtable）の扱いを決める（下記）
- [ ] キャリタスUC・各媒体の応募先URLを新URLに差し替える
- [ ] 北海道科学大学など「有償は不可」の学校向けに配信する求人からは、有償LPへのリンクを張らない（このLPは有償LPへのリンクなし）

## 応募フォームについて

現在は既存LPと同じAirtableフォームを埋め込み、「自由記述欄の冒頭に【コミュニティ枠】と記入」してもらう暫定運用。
別フォーム（またはフォームの別ビュー）を作った場合は、`index.html` の `airtable.com/embed/...` と「別タブで開く」リンクの2か所を差し替える。
