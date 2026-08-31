# target-selectorによる操作対象ロボットの選択のしくみ

`target-selector`は、各ロボットではなく配送側(event-distributorのある
entity)に付くcomponent。distributorは左右のVRコントローラーに一つづつ
存在する

選択のためのeventの引数で、選択される選択されるロボットの代表DOMのidを
渡され、このidとdistributorのリストとを引数にrobotRegistryの
eventDeliveryOneLocationを呼ぶ。enableEventDeliveryは、
distributor.listenersList[id]にregistryに登録されているidのel(ロボット
代表DOM)をセットし、そのelのshouldListenEventsを+1する。
eventDeliveryOneLocationは一つだけenableにして他をdisableする

target-selectorはeventDeliveryOneLocationを呼ぶため、(左右でそれぞれ)
distributor.listenersList[id]の1個にだけが存在することになる


multiple-togetherは、ロボットともコントローラーと独立した別の
DOM(entity)である仮想ロボットに付くことを想定する。この仮想ロボットが
target-selectorで選択されると(仮想ロボット
の)`should-listen-event-changed`イベントがemitされ、そのlistenerで自分
(仮想ロボット)のshouldListenEventsの値を調べて、
setAttribute/removeAttributeする(仮想ロボット用
`reserve-multiple-together`コンポーネントの動作)。

仮想ロボットと実ロボットの目標座標系は相対関係が固定され、実ロボットは
`arm-motion-ui`のschemaを変更することでVRcontroller相対ポーズ動作から
world座標系絶対動作に切り替わる

`multiple-together`は`event-distributor`を**使用しない**。イベントは
`multiple-together`自体がemitする。`shouldListenEvents`の値も
`multiple-together`自体が増減する

`multiple-together`は、`setAttribute`されると、自分のschemaで定義され
ているロボットをlistenersListに複数個elを登録する。removeAttributeのと
きにそれらの登録を抹消する。
