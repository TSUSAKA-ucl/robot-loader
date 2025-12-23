# 実装メモ
## A-Frame robot-loaderリポジトリの種々カスタムコンポーネントで利用するevents
### 主にrobot loaderが扱う主にthis.el(robot planeなど)でemitされるevent

#### loaded
* `loaded`: (default)	各componentのinitが終了した
* 対応するthis.elのプロパティ: hasLoaded
* 注: 土台(plane等)のentityのinitでは、urdf.jsonのローダー関数がasyncで、initはそれをawaitしているため遅くなる可能性がある
#### robot-dom-ready
* `robot-dom-ready`: fetchしたurdf.jsonに相当するDOMがend linkまで全てcreateElementされた
* emitされるentity: 土台(plane等)
* 対応する this.elのプロパティ: this.el.model (!== null)
* 注: ik-workerはこれで動き出す(できるだけ早い時点て生成できるように & いずれ
  robot registry無しでも動く設計思想のため)
#### robot-registered
* `robot-registered`: this.el.endLink, this.el.axesがセットされてregistryに
  登録された。大抵 robot-dom-readyの直後
* emitされるentity: 土台(plane等)
* 対応するthis.elのプロパティ: this.el.endLink, this.el.axes
* 注: this.el.endLinkやthis.el.axesを使うrefrect-worker-jointsやattach-to-anotherはこれに同期
#### ik-worker-ready
* `ik-worker-ready`: ik-workerコンポーネントが生成するik-workerの初期化が完了し、
  各種postMessageが正しく解釈される
* emitされるentity: 土台(plane等)
* 対応するthis.elのプロパティ: this.el.ikWorkerReady (true )
#### ik-worker-start
* `ik-worker-start`: robot repositoryにworkerとworkerDataが登録された
* emitされるentity: 土台(plane等)
* 対応する this.elのプロパティ: this.el.workerData.current.joints (!== null)
#### model-loaded
* `model-loaded`: (default)
* emitされるentity: 各a-entity (class='visual'など)
* 対応する this.elのプロパティ: this.el.getObject3D('mesh') (!== null)
#### attached
* `attached`:	by attachToAnother
* emitされるentity
* 対応する this.elのプロパティ

attach-to-anotherは、this.el(末端側).resetTargetsに登録されている名前のcomponent一度removeAttributeして
再度setAttributeする(initから動く)。さもないとparenting(ツリー構造の改変)を行うと、その先のtickが動かなくなる
