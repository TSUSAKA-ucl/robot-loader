2026.08.27

特定のコンポーネントが別ファイルに有るコンポーネントをsetAttributeするために
importしているケースのまとめ

1. `a-axes-frame`component in `axesFrame.js`  
   特定のentityに座標系表示を付与する
   * `addFrameToJoints.js`
   * `armMotionUI.js`

2. `send-base-coord`component in `sendBaseCoord.js`  
   entityの座標系(の移動)を`ik-worker`に送る
   * `attachToAnother.js`
   * `baseMover.js`
   * `oneAxisMover.js`

3. `reflect-worker-joints`component in `reflectWorkerJoints.js`
   * `ikWorker.js` : May be deprecated.

4. `attach-to-another`の特殊事情  
   `attach-to-another`には3通りの実装案がある
   1. DOMを付け替える(AFrameごと変更する)
   2. DOMはそのままにして、THREEのObject3Dの親子関係だけ変更する(AFrameとTHREEが矛盾する)
   3. DOMもTHREEもそのままにして、tickで計算してobject3Dの相対poseの値だけ変更する
   以上のうち、1.はReactとのタイミングの関係でAFrameがtickを呼び出さなくなるケースが稀に発生する。
   3.はentityのposeの変更のタイミングが親と子の間で1フレームずれてちらつく。
   2.はAFrameで不用意にsetAttributeしなければ低負荷でキレイに動く。
   そのため、方法2が標準で採用されているが、一方で1.は実装として分かりやすくキレイである。
   ただし、1.はtickが呼び出されなくなる問題点を低減するため、attachする子DOMをリセットする
   仕掛け(`registerResetTarget`)が組み込まれている。2.(標準)では不要だが、
   `registerResetTarget`を呼び出す他のcomponentのソースを変更せずに対応するため
   ダミーの何もしない`registerResetTarget`が組み込まれている。
   結果として、方針2.の場合であれば不要なimportが他のcomponentのソースに残っている。
   
