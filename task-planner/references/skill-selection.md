# ガイドの用途

依頼と既存成果物の内容・確認状態から作業を選ぶ。文書の役割は担当ガイドで確かめ、見本は[文書の構成一覧](../../document-guide/references/composition-selection.md)で確認する。

| 作業 | 担当ガイド | 文書 → 見本 | 選択時に確かめること |
|---|---|---|---|
| チケットと作業場所の準備・管理 | `ticket-guide` | 概要資料 → `overview.html` | 対象、管理ルート、チケットとworktreeの状態 |
| 要件を定める | `requirements-guide` | 要件書 → `refinement.html` | 依頼と既存資料、要件の確認状態 |
| 設計を定める | `design-guide` | 設計書 → `design.html` | 確認済み要件、既存の設計と実装、設計の確認状態 |
| 実装する | `implementation-guide` | 実装記録 → `implementation.html` | 確認済み要件と設計、実装・自動テストの状態、記録の更新範囲 |
| 部分レビュー | `review-guide` | 指定された種類だけ。コード → `code-review.html`、コメント → `comment-review.html`、カバレッジ → `coverage.html`、既存テスト → `test-review.html` | 指定された対象と対応する参照資料 |
| 開発工程全体のレビュー | `review-guide` | コード → `code-review.html`、コメント → `comment-review.html`。これらに加え、カバレッジ → `coverage.html`か既存テスト → `test-review.html`の一方 | カバレッジと既存テストのどちらを扱うか、依頼と既存成果物から選ぶ。選べなければ未決と示す |
| PRの指摘確認 | `pr-guide` | PR指摘整理資料 → `pr-review.html` | PRの会話・差分と現在の実装 |
| PRへのコメント投稿 | `pr-guide` | 投稿用レビューコメント → `pr-comments.md` | 根拠となるレビュー成果物を確認する。未作成または現行実装に対応しなければ`review-guide`も選ぶ。コメントの文章には`writing-guide`も選ぶ |
| 実画面による手順確認・検証 | `agentic-test-guide` | 画面検証の手順書 → `agent-test.html`、再利用する操作知識 → `agent-runbook.html` | 検証内容、実画面確認、結果と残件 |
| 原因・挙動・変更内容・影響範囲の調査 | `investigate-code` | 固定の文書なし | 調査対象、比較元、確認できる根拠 |
| 文章の作成・書き直し・レビュー、コミットメッセージ | `writing-guide` | 文書を作る場合はその役割の見本 | 原文と根拠、共通要素でまとめた親と整理した子の関係、ツリーからの文章化と原文との照合範囲 |
| 文書の作成・更新 | `document-guide` | 選んだ文書の役割 → 構成一覧の見本 | 読み手と用途、形式、保存と表示確認 |
