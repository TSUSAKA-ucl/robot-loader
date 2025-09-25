# ツリーのファイル構成
現在のjsのパッケージのファイル構成は以下のとおりで、`packges/main/dist/`に
生成物が集まり、そこの`index.html`経由でメインのjsをブラウザが読むと、workerを
立ち上げworkerが実行時のimportで`rapierObjectUtils.js`を読み込み、さらに動的
importで`physicalObj.config.js`を読み込み、ページが動き出す。
```
project/
├─ .git/
├─ node_modules/
├─ package.json
├─ packages/
│  ├─ main/
│  │  ├─ dist/
│  │  ├─ index.html
│  │  ├─ node_modules/
│  │  ├─ package.json
│  │  ├─ public/
│  │  │  ├─ physicalObj.config.js
│  │  │  ├─ rapier-worker.mjs
│  │  │  └─ rapierObjectUtils.js
│  │  ├─ src/
│  │  │  ├─ App.css
│  │  │  ├─ App.jsx
│  │  │  ├─ RapierWorker.jsx
│  │  │  └─ main.jsx
│  │  └─ vite.config.mjs
│  └─ rapier-worker/
│     ├─ dist-worker/
│     ├─ package.json
│     ├─ src/
│     │  ├─ rapierObjectUtils.js
│     │  └─ rapierWorker.js
│     └─ vite.config.mjs
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml
├─ FileTree.md
└─ README.md
```
ユーザーは`main/src/App.css`,`main/src/App.jsx`,
`main/public/physicalObj.config.js`を書く。`main/src/RapierWorker.jsx`,
`main/public/rapier-worker.mjs`, `main/public/rapierObjectUtils.js`は
汎用コードでユーザーは使用するだけで編集する必要は無い。
`packages/rapier-worker`パッケージは、
`packages/main/public/rapier-worker.mjs`および
`packages/main/public/rapierObjectUtils.js`をビルド(あるいはコピー)する
ために使用されユーザーからはblack boxでよい。
