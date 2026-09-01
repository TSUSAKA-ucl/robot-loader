# `reserve-mutiple-together`と`mutiple-together`コンポーネントの動作説明

`event-distributor`と`arm-motion-ui`の間に割り込み、`arm-motion-ui`が
vrControllerの位置姿勢と思っているものをすり替える。eventはそのまま
`arm-motion-ui`の付いているentityに流す

`arm-motion-ui`は、vrControllerからeventと`object3D.position`,
`object3D.quaternion`を取得し`workerPose`と諸々の計算で`ik-worker`に
destinationをpostMessageする

`multiple-together`は、vrControllerの各eventをlistenしてそれをschemeに
示したentityにforwarding(同じものをemit)する。さらに
`event-distributor`が`detail.originalTarget`にバインドした元
(vrController)のentityを自分が計算したobject3Dを持つダミーentityに付け
替える。`arm-motion-ui`は、あたかもダミーentityのobject3Dの位置姿勢の
vrControllerからeventを受け取ったかのごとくに動く。`arm-motion-ui`は自
entityの`shouldListenEvents`を見て`ik-worker`を動かす(post
destination)かどうかを決めるため`shouldListenEvents`もインクリメント
する。

どこにeventを配信するかの情報は`target-selector`が保持している
`target-selector`はschemaに定義されたeventをlistenし、そのdetailから
テキストを取り出してeventを配信する先のターゲットを設定する
(`selectFunc`)。`selectFunc`は`event-distributor`と`robot-registry`を
取り出して、ターゲットid文字列とdistributorElを引数に
`robot-registry`の`eventDeliveryOneLocation`を呼ぶ
`eventDeliveryOneLocation`は、distributorに登録されいてる全entity(id)
中該当entityだけ`enableEventDelivery`して他は`disableEventDelivery`す
る`enableEventDelivery`は、distributorの`listenerList`にlistenerの
entityを登録しlistenerのentityの`shouldListenEvents`をインクリメントする。

しかし、`multiple-together`はdistributorとは別ラインでeventを配信する。
(別のvrControllerの)distributorからのeventをターゲットのelに無視させる
ため`el.masterController`に一時的に自分のelを書き込む。

distributorにメンテされるのは`listenerList`と各entityの
`shouldListenEvents`プロパティーだが`multiple-together`は
`masterController`を使ってそれをオーバーライドしobject3Dをすり替えて
eventを複数に一斉配信する。その前に配信先の`shoudListenEvents`プロパ
ティーをインクリメントしさらに`arm-motion-ui`用にダミーentityにはfalse
の`laserVisible`プロパティーを付けておく必要があるまた
`arm-motion-ui`の`dummyLaserLineThree()`を呼び出しておき配信をやめる
ときに`undefineLaserLineThree()`を呼び出しておくと良い(**必須ではない**
が無駄な計算を抑制できる)

`multiple-together`機能を選択するために、`reserve-multiple-together`を
つけるentityをrobotRegistryに登録する必要がある。
`reserve-multiple-together`コンポーネントは、おなじentityに、
`multiple-together`を`setAttribute`/`removeAttribute`する機能を定義する。
自分のentity(`reserve-multiple-together`)の`shouldListenEvents`の
値を見て>0になったら`setAttribute`して、<=0になったら
`removeAttribute`すればよいが、reserverがtickでpollingするのは無駄なので
`robot-registry`の`enableEventDelivery`と`disableEventDelivery`を改造
して`shouldListenEvents`が変化するときに
`should-listen-event-changed`eventをemitすることとする
(`checkListenerList`のon demand生成時は0なのでemit不要と言うことにする)

`robot-registry`への登録は`reserve-multiple-together`コンポーネントで
直接行い`robot-loader`は通さない。`robot-loader`の
`registerRobotFunc`と類似のコードでシンプルに登録する。`axes=[]`,
`realAxes=[]`, `endLinkEl=自分`で、
`robotRegistryComp.newId(id,{el: 自分, axes: axes, endLink: endLinkEl});`
さらに`robot-registered`イベント用に自分に`axes`,`realAxes`,
`endLinkEl`を付けて`robot-registered`をemitする
