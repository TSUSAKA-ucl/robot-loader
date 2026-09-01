# `ik-worker`に指示を出す(postMessageする)コンポーネント一覧

以下のうち`destination`, `set_joint_targets`, `set_base_coord`をpostMessageする
コンポーネントはAFrameのアニメの動きを決めるため重要である。事実上`arm-motion-ui`が
IK呼び出しを担っている

`arm-motion-ui`コンポーネントは唯一のIK(singularity low-sensitive motion resolver)を
動かす`destination`タイプのメッセージをpostMessageする。
`arm-motion-ui`は、`tick`の中で `this.el`と`vrControllerEl`のプロパティーを調べて
以下の条件の時だけ`vrControllerEl.object3D`の値に基づいて`destination`をpostMessageする
1. `this.vrControllerEl.laserVisible === false`
2. `this.el.shouldListenEvents === true`
3. `this.triggerdownState === true`
4. `!this.el.masterController || this.el.masterController === this.vrControllerEl`

`this.vrControllerEl`は`triggerdown`イベントをlistenした時に
`evt.detail.originalTarget`がentityである(すなわち`object3D`を持ってい
る)ことを期待して設定され、その`object3D`を位置姿勢目標計算に使う。
`this.el.masterController`を設定することで、関係ないDOMから
`triggerdown`イベントが送られてきても無視することができる。
`robot-registry`によるターゲット管理は、一つのコントローラーで同時に複
数ロボットを動かせるように設計されているため、他のコントローラーによる
動作を排除したい場合は、`this.el.masterController`に自分(コントロー
ラー)の(`detail.originalTarget`に付ける)elを設定しておく必要がある。ロ
ボット(独占)操作を解除する場合は`this.el.masterController`を元にもどさ
ないと、横取りされたら再度取り戻さないと操作できない

## `ik-worker`の実時間動作司令

`./robot-loader/src/armMotionUI.js`:213:	`destination`
`./robot-loader/src/baseMover.js`:50:	`set_base_coord`
`./robot-loader/src/fingerCloser.js`:76:	`set_joint_targets`
`./robot-loader/src/jointMoveTo.js`:18:	`set_joint_targets`
`./robot-loader/src/sendBaseCoord.js`:41:	`set_base_coord`

## 上記コンポーネントを付与あるいはモード変更(`setAttribute`)することで間接的に実時間動作司令

`./robot-loader/attachToAnother.js`:40:      `send-base-coord`
`./robot-loader/baseMover.js`:16:      `send-base-coord`
`./robot-loader/ikWorker.js`:24:	`reflect-worker-joints`
`./robot-loader/multipleTogether.js`:122:        `arm-motion-ui`
`./robot-loader/multipleTogether.js`:303:        `arm-motion-ui`
`./robot-loader/multipleTogether.js`:353:	  `multiple-together`
`./robot-loader/oneAxisMover.js`:26:      `send-base-coord`

## `ik-worker`の設定指示

`./robot-loader/src/ikWorker.js`:108:	`set_joint_weights`
`./robot-loader/src/ikWorker.js`:172:	`set_slrm_loglevel`
`./robot-loader/src/ikWorker.js`:180:	`set_joint_desirable`
`./robot-loader/src/ikWorker.js`:216:	`set_all_joint_desirable_vlimit`
`./robot-loader/src/ikWorker.js`:223:	`set_joint_desirable_vlimit`
`./robot-loader/src/reflectWorkerJoints.js`:64:	`set_exact_solution`
`./ik-cd-worker/src/IkWorkerManager.js`:143:	`set_base_coord`
`./ik-cd-worker/src/IkWorkerManager.js`:166:	`set_exact_solution`
`./ik-cd-worker/src/IkWorkerManager.js`:169:	`set_initial_joints`
`./ik-cd-worker/src/IkWorkerManager.js`:223:	`set_end_effector_point`
`./ik-cd-worker/src/IkWorkerParamsComponents.js`:28:	`set-exact-solution` `set-ignore-joint-limits` `set-ignore-collisions` `set-joint-limit-keep-moving`
`./ik-cd-worker/src/IkWorkerParamsComponents.js`:69:	`set_joint_limit_keep_moving_mask`

## `cd-worker`への間接的指示(`ik-worker`経由)

`./robot-loader/src/attachToAnother.js`:100:	`stop_dependency`
`./robot-loader/src/ignoreCollision.js`:103:	`ignore_pairs`

## `cd-worker`への直接指示

`./ik-cd-worker/src/IkWorkerManager.js`:112:	`add_port`,
`./ik-cd-worker/src/IkWorkerParamsComponents.js`:115:	`**log_timing`
`./ik-cd-worker/src/IkWorkerParamsComponents.js`:145:	`**log_collision`
