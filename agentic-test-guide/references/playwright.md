# playwright-cliの使い方

ブラウザの起動から観察・操作・終了までを`playwright-cli`で行うときに読む。[接続の規則](browser-session.md)と[画面操作の規則](browser-operations.md)を各コマンドで守る方法を示す。

## コマンドが利用できるか確認する

`playwright-cli`が利用できることを確認する。

```bash
playwright-cli --version
```

プロジェクトの依存関係に`@playwright/cli`が入っている場合はプロジェクトに導入済みの実行ファイルで呼ぶ（例：`./node_modules/.bin/playwright-cli`）。実行ファイルの取得を伴う呼び出しは使わない。この文書では`playwright-cli`と表記する。グローバルのコマンドとプロジェクトに導入済みの実行ファイルのどちらも見つからない場合は、インストールせず、`playwright-cli`の導入を再開条件として停止する。

## 起動

アプリの稼働を確認し、対象URLを確定してから起動する。`list`でセッション名の重複を避ける。

```bash
playwright-cli list
playwright-cli -s=<name> open <targetUrl>
playwright-cli -s=<name> tab-list
```

`--browser`を付けなければ同梱のChromiumで開く。`chrome`または`msedge`が明示された場合だけ`--browser=chrome`または`--browser=msedge`を付ける。`--browser=chromium`は同梱のChromiumを指さないため使わない。

起動したセッション名、対象オリジン、今回の作業で起動したことを控え、以後はすべてのコマンドに`-s=<name>`を付ける。

## 接続

接続は、入力の接続情報に応じて次のように行う。

- セッション名が渡された場合は、すべてのコマンドに`-s=<name>`を付けてそのセッションを使う。ブラウザを開いた側が`open`で開いたセッションも、`attach`で接続したセッションも、同じ形で受け取る。
- 稼働中ブラウザのCDP接続先だけが渡された場合は、`playwright-cli attach --cdp=<endpoint> --session=<name>`で接続し、以後は`-s=<name>`を付ける。セッション名には目的が分かる未使用の名前を付ける。

接続後、`tab-list`で、操作するタブのURLが操作を許可されたオリジンに属することを確認する。同じオリジンのタブが複数ある場合は、依頼と現在の状態から一つに決められなければ`tab_ambiguous`として停止する。

接続を借りたのか、今回`open`または`attach`したのかを控える。利用者待ちでは接続を維持し、終了時は「終了・解放」に従う。

## 使えるコマンドの一覧

利用者が画面で行う操作と、画面や操作結果を確認する操作だけを使う。

| 区分 | コマンド | 用途 |
|---|---|---|
| 移動 | `goto <url>`、`go-back`、`go-forward`、`reload` | 同一オリジン内のURLへ移動する |
| 操作 | `click`、`dblclick`、`fill`、`type`、`select`、`press`、`hover`、`check`、`uncheck`、`upload`、`drag` | 対象要素への定型操作 |
| 観察 | `snapshot`、`find`、`screenshot` | 画面構造の取得、要素の検索、画像の保存 |
| 記録 | `console`、`requests`、`request <n>` | コンソール出力と、送受信した要求の確認 |
| タブ | `tab-list`、`tab-new <url>`、`tab-select <n>`、`tab-close <n>` | タブの一覧表示、同一オリジン内での新規作成、切り替え、閉じる操作 |
| ダイアログ | `dialog-accept [text]`、`dialog-dismiss` | 入力で指定された応答を返す |
| セッション | `attach`、`detach`、`list` | 稼働中ブラウザへの接続と解放 |

次のコマンドは使わない。ブラウザの`open`と`close`は、環境準備と終了確認のときだけ、起動と所有の規則に従って使う。

- `eval`、`run-code`
- `route`、`unroute`
- `cookie-*`、`localstorage-*`、`sessionstorage-*`、`state-save`、`state-load`
- `close-all`、`kill-all`、`delete-data`

観察結果を機械的に読み取るときは`--raw`を付けてよい。

## 操作する要素を指定する

操作対象は、画面で確認できる名前や役割を使って指定する。Playwrightのロケーターは、次の順に選ぶ。

1. `getByRole(...)`
2. `getByLabel(...)`
3. `getByText(...)`

これらで対象を一意に指定できない場合だけ、CSSセレクターを使う。

対象は表示中の要素が一つに決まらなければならず、複数一致する場合は`{ exact: true }`、`.filter({ hasText: ... })`、行や領域の中に範囲を限ることで絞る。画面全体を対象にした`nth()`では選ばない。

```bash
playwright-cli -s=app click "getByRole('row', { name: '<order-number>' }).getByRole('button', { name: 'メニュー' })"
playwright-cli -s=app click "getByRole('menuitem', { name: '所属グループを編集', exact: true })"
playwright-cli -s=app fill "getByLabel('日数')" "3"
```

`snapshot`が返す参照（`e15`など）は、その実行のときにだけ使う。操作知識、手順、報告には参照を書かず、ロケーターを書く。操作知識の文書が示すロケーターで対象が見つからない場合は、`snapshot`または`find`で現在の画面を確認し、画面が変わっていると判断したらその旨を報告して停止する。文書を推測で直しながら操作を続けない。

入力欄の現在値は`snapshot`で読む。パスワード欄の値は取得しない。

## 待機と確認

画面の変化は、各コマンドの後に返るページのURLとタイトル、および`snapshot`で確認する。到達したかどうかは、URLまたは特定の要素の有無を根拠に判断し、一定時間待つだけで済ませない。操作が時間内に完了しない場合は、同じ操作を繰り返さず、`snapshot`で状態を確認して報告する。

## ダイアログ

`alert`、`confirm`、`prompt`が出る操作では、入力で指定された応答を`dialog-accept`または`dialog-dismiss`で返す。入力に応答がないダイアログが出た場合は、推測で応答せず、ダイアログの文言を添えて`unexpected_dialog`として停止する。

## タブ

タブは、状態に応じて次のように扱う。

| タブの状態 | 扱い |
|---|---|
| 操作で新しく開いた | `tab-list`で確認し、`tab-select`で操作対象を明示する。 |
| 操作を許可されたオリジンの外にある | 操作しない。 |
| 自分が作り、不要になった | `tab-close`で閉じる。 |
| 利用者が残した、または後のケースで使う | 閉じない。 |

## 証跡

画像は`screenshot --filename=<path>`で、確定した証跡ディレクトリの内側に保存する。一連の作業では一つの証跡ディレクトリを使い、`01-signin.png`のように撮影順と内容が分かる名前にする。必要なら`snapshot --filename=<path>`で画面構造も同じディレクトリに残す。

## コマンドが失敗したときの対応

コマンドが失敗した場合は、出力と再観察から原因と現在の状態を確認する。対象の指定や手順の修正が必要なら、手順作成へ戻って確認する。実行済みか不明な更新操作は再送しない。推測で代わりの操作をせず、失敗したコマンド、確認した状態、実行済みの操作、再開条件を残す。

## 終了・解放

利用者待ち・手動確認が終わり、接続を残す必要がなくなったら、今回の作業で行った起動・接続の記録に従って終了する。

| セッションとの関係 | コマンド | ブラウザの扱い |
|---|---|---|
| 今回`open`で起動した | `playwright-cli -s=<name> close` | 終了する |
| 今回`attach`で接続した | `playwright-cli -s=<name> detach` | 起動したまま残す |
| 既存のセッションを借りた | 終了・解放しない | 維持して引き渡す |

自分の起動・接続を確認できない場合は終了せず、残っている状態を報告する。`close-all`と`kill-all`は使わない。
