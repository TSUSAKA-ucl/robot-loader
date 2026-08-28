//
// event-distributorとarm-motion-uiの間に割り込み、arm-motion-uiがvrControllerの
// 位置姿勢と思っているものをすり替える。eventはそのままarm-motion-uiの付いているentity
// に流す
//
// arm-motion-uiは、vrControllerからeventとobject3D.position, object3D.quaternionを
// 取得しworkerPoseと諸々の計算でik-workerにdestinationをpostMessageする
//
// multiple-togetherは、vrControllerの各eventをlistenしてそれをschemeに示した
// entityにforwarding(同じものをemit)する。さらにevent-distributorがdetailのoriginalTargetにバインドした
// 元(vrController)のentityを自分が計算したobject3Dを持つダミーentityに付け替える
// arm-motion-uiは、あたかもダミーentityのobject3Dの位置姿勢のvrControllerから
// eventを受け取ったかのごとくに動く
// arm-motion-uiは自entityのshouldListenEventsを見てik-workerを動かす(post destination)
// かどうかを決めるためshouldListenEventsもインクリメントする必要がある
//
// どこにeventを配信するかの情報はtarget-selectorが保持している
// target-selectorはschemaに定義されたeventをlistenし、そのdetailからテキストを取り出して
// eventを配信する先のターゲットを設定する(selectFunc)。
// selectFuncはevent-distributorとrobot-registryを取り出して、ターゲットid文字列と
// distributorElを引数にrobotRegistryのeventDeliveryOneLocationを呼ぶ
// eventDeliveryOneLocationは、distributorに登録されいてる全entity(id)中
// 該当entityだけenebleEventDeliveryして他はdisableEventDeliveryする
// enableEventDeliveryは、distributorのlistenerListにlistenerのentityを
// 登録しlistenerのentityのshouldListenEventsをインクリメントする
//
// 最終的にメンテされるのはdistributorのlistenerListと各entityのshouldListenEventsプロパティー
// このmultiple-togetherは、distributorに変わりobject3Dをすり替えてeventを複数に一斉配信するが
// その前に配信先のshoudListenEventsプロパティーをインクリメントし
// さらにarm-motion-ui用にダミーentityにはfalseのlaserVisibleプロパティーを付けておく必要がある
// またarm-motion-uiのdummyLaserLineThree()を呼び出しておき配信をやめるときにundefineLaserLineThree()
// を呼び出しておくと良い(必須ではないが無駄な計算を抑制できる)
//
// これらの動作を実現するためには、このmultiple-togetherをつけるentityをrobotRegistryに
// 登録する必要がある。おなじentityに、multiple-togetherをsetAttribute/removeAttributeするための
// reserve-multiple-togetherコンポーネントを定義して自分のentityのshouldListenEventsの値を見て>0になったら
// setAttributeして、<=0になったらremoveAttributeすればよいが、reserverがtickでpollingするのは無駄なので
// robotRegistryのenableEventDeliveryとdisableEventDeliveryを改造してshouldListenEventsが
// 変化するときにshould-listen-event-changed eventをemitすることとする
// (checkListenerListのon demand生成時は0なのでemit不要と言うことにする)
//
// robotRegistryへの登録はreserve-multiple-togetherコンポーネントを使いrobot-loaderは通さない。
// robot-loaderのregisterRobotFuncと
// 類似のコードでシンプルに登録する。axes=[], realAxes=[], endLinkEl=自分で、
// robotRegistryComp.newId(id,{el: 自分, axes: axes, endLink: endLinkEl});
// さらにrobot-registeredイベント用に自分にaxes,realAxes,endLinkElを付けて
// robot-registeredをemitする
//
import {customLogger} from './customLogger.js'
globalThis.__customLogger = customLogger;
import AFRAME from 'aframe';
const THREE = window.AFRAME.THREE;
import { VR_EVENTS } from './vrControllerEvents.js'
import {newObjPoseConstsWorld, newObjPoseUI} from './newObjPoseUI.js'

// schemaで複数のentityのidを引数にとる
// それらがloadedになった時にarm-motion-uiコンポーネントが付いているかどうか確認して
// 付いていないentityは、このあと全て無視。付いているentityに対応して
// ダミーコントローラー(el風の単なるTHREEのobject3D用のスロットだけ持つJavaScriptオブジェクト)を作る
// ダミーコントローラーの親はワールドで良い
// このmultiple-togetherコンポーネントがvrController(event-distributorコンポーネント)からの
// イベントを受け取ったら、以下を行う。
// 1. 現在のこのentityのobject3Dをschemaのentityリストの全部の平均位置と平均的な姿勢に書き換え
// 2. ダミーコントローラーのobject3Dを現在のschema entityリストのobject3Dと一致
// 3. このentityとschema entityリストのentityの相対位置姿勢を固定値として記憶
// 4. evt.detail?.originalTargetを、リストのentityに対応するダミーコントローラーのに書き換えてschemaのリストのentityに投げる(emit)
// 5. tickで、ダミーコントローラーのobject3Dの更新を行う。ダミーコントローラーのワールド位置姿勢が、
// このentityのobject3Dのワールド位置姿勢から3.で記憶した相対位置姿勢ずらしたところになるように、
// ダミーコントローラーのobject3Dを書き換える。
AFRAME.registerComponent('multiple-together', {
  schema: {
    targets: { type: 'array', default: [] } // 例: ["obj1", "obj2"]
  },

  init: function () {
    this.validEntities = [];
    this.dummySlots = new Map(); // entityId -> { object3D, el }
    this.relativeTransforms = new Map(); // entityId -> { position, quaternion }

    // Three.js 計算用の作業用変数（GC削減）
    this.tmpVec = new THREE.Vector3();
    this.tmpQuaternion = new THREE.Quaternion();
    this.tmpMatrix = new THREE.Matrix4();
    this.targetWorldPos = new THREE.Vector3();
    this.targetWorldRot = new THREE.Quaternion();

    this.onVREvents = this.onVREvents.bind(this);
    this.onVRTriggerDown = this.onVRTriggerDown.bind(this);
    this.onVRTriggerUp = this.onVRTriggerUp.bind(this);
    this.setupTargets();
  },

  setupTargets: function () {
    globalThis.__customLogger?.warn('multiple-together: setupTargets', 'targets:', this.data.targets);
    const promises = this.data.targets.map(selector => {
      globalThis.__customLogger?.warn('multiple-together: setupTargets', 'selector:', selector);
      return new Promise(resolve => {
        const targetEl = document.getElementById(selector);
	  // || document.querySelector(selector);
        if (!targetEl) return resolve(null);

        if (targetEl.hasLoaded) {
          resolve(targetEl);
        } else {
          targetEl.addEventListener('loaded', () => resolve(targetEl), { once: true });
        }
      });
    });

    Promise.all(promises).then(entities => {
      globalThis.__customLogger?.warn('multiple-together: setupTargets', entities.map(el => el?.id).join(', '));
      // arm-motion-ui が付いているEntityのみを抽出
      this.validEntities = entities.filter(el => el && el.components['arm-motion-ui']);

      // ターゲットごとに超軽量なダミーオブジェクトを作成
      this.validEntities.forEach(el => {
        const dummyObject3D = new THREE.Object3D();

        // 最小限のダミー構造（DOMを作らない）
        const dummySlot = {
          object3D: dummyObject3D,
          // arm-motion-ui 側で originalTarget.el.object3D や originalTarget.object3D
          // どちらのアクセス方法でもエラーにならないためのダミー参照
          el: null 
        };
        dummySlot.el = dummySlot;

        this.dummySlots.set(el.id, dummySlot);

	// 各valid entityのtickが動き出すように shouldListenEvents をインクリメント
	if (typeof this.el?.shouldListenEvents === 'number') {
	  this.el.shouldListenEvents++;
	}
      });

      // イベントリスナーの登録（event-distributor等からのイベントを受信）
      VR_EVENTS.forEach(evtName => {
	this.el.addEventListener(evtName, this.onVREvents);
      });
      this.el.addEventListener('triggerdown', this.onVRTriggerDown);
      this.el.addEventListener('triggerup', this.onVRTriggerUp);
    });
  },

  onVRTriggerUp: function (evt) {
    this.triggerdownState = false;
  },
  onVRTriggerDown: function (evt) {

    if (this.validEntities.length === 0) return;

    // 1. 全対象Entityの平均位置・姿勢（重心）を計算
    const avgPos = new THREE.Vector3(0, 0, 0);
    const quaternions = [];

    this.validEntities.forEach(el => {
      el.object3D.getWorldPosition(this.targetWorldPos);
      el.object3D.getWorldQuaternion(this.targetWorldRot);
      avgPos.add(this.targetWorldPos);
      quaternions.push(this.targetWorldRot.clone());
    });
    avgPos.divideScalar(this.validEntities.length);

    // 簡易的な平均回転の適用
    const avgRot = quaternions[0];

    // 2. 自身の Object3D を平均位置・姿勢に移動
    this.el.object3D.position.copy(avgPos);
    this.el.object3D.quaternion.copy(avgRot);
    this.el.object3D.updateMatrixWorld();

    this.vrControllerEl = evt.detail?.originalTarget;
    newObjPoseConstsWorld(this, this.vrControllerEl,
			  this.el,
			  this.el.sceneEl.camera.position);
    this.triggerdownState = true;

    const parentWorldInv = new THREE.Matrix4()
      .copy(this.el.object3D.matrixWorld)
      .invert();

    // 3. 各 Entity の「この Entity に対する相対位置姿勢」を記憶 & ダミー同期
    this.validEntities.forEach(el => {
      const dummySlot = this.dummySlots.get(el.id);

      // ダミーのワールド位置をターゲットEntityの現在位置に同期
      el.object3D.getWorldPosition(dummySlot.object3D.position);
      el.object3D.getWorldQuaternion(dummySlot.object3D.quaternion);
      dummySlot.object3D.updateMatrixWorld();

      // 自身からの相対変換行列を計算して記憶
      const relativeMatrix = new THREE.Matrix4()
        .multiplyMatrices(parentWorldInv, el.object3D.matrixWorld);

      const relPos = new THREE.Vector3();
      const relRot = new THREE.Quaternion();
      const relScale = new THREE.Vector3();
      relativeMatrix.decompose(relPos, relRot, relScale);

      this.relativeTransforms.set(el.id, { position: relPos,
					   quaternion: relRot });
    });
  },

  onVREvents: function (evt) {
    globalThis.__customLogger?.warn('multiple-together: onVREvents', evt.type,
				    'from', evt.detail?.originalTarget?.id,
				    ' to', this.validEntities.map(el => el.id).join(', '),
				   ' length:', this.validEntities.length);
    // 自身が合成発火したイベントは無視して再帰ループを防止
    if (evt.detail && evt.detail.fromMultipleTogether) {
      return;
    }

    this.validEntities.forEach(el => {
      const dummySlot = this.dummySlots.get(el.id);
      // 4. originalTarget をダミーに書き換えてそのままイベントを再発火
      // 浅いコピーで detail を作成し、ループ防止フラグを付与
      const newDetail = Object.assign({}, evt.detail, {
        originalTarget: dummySlot,
        fromMultipleTogether: true
      });

      // バブルアップなし (bubbles = false) でターゲット Entity に投げる
      el.emit(evt.type, newDetail, false);
    });
  },

  tick: function () {
    if (this.el?.shouldListenEvents && this.vrControllerEl) {
      const newPose = newObjPoseUI(this, this.vrControllerEl);
      if (newPose) {
	this.el.object3D.position.copy(newPose[0]);
	this.el.object3D.quaternion.copy(newPose[1]);
      }
    }
    if (this.validEntities.length === 0) return;

    const selfWorldMatrix = this.el.object3D.matrixWorld;

    // 5. 毎フレーム、ダミーのワールド位置姿勢を「自身のワールド位置姿勢 + 相対位置姿勢」に更新
    this.validEntities.forEach(el => {
      const rel = this.relativeTransforms.get(el.id);
      const dummySlot = this.dummySlots.get(el.id);
      if (!rel || !dummySlot) return;

      // 相対変換行列を作成
      this.tmpMatrix.makeRotationFromQuaternion(rel.quaternion);
      this.tmpMatrix.setPosition(rel.position);

      // 自身のワールド行列 × 相対行列 ＝ ダミーの新しいワールド行列
      const dummyWorldMatrix = new THREE.Matrix4()
        .multiplyMatrices(selfWorldMatrix, this.tmpMatrix);

      dummyWorldMatrix.decompose(
        dummySlot.object3D.position,
        dummySlot.object3D.quaternion,
        this.tmpVec
      );

      dummySlot.object3D.updateMatrixWorld();
    });
  },

  remove: function () {
    VR_EVENTS.forEach(vrControllerEvent => {
      this.el.removeEventListener(vrControllerEvent, this.onVREvents);
    });
    this.el.removeEventListener('triggerdown', this.onVRTriggerDown);
    this.el.removeEventListener('triggerup', this.onVRTriggerUp);
    // 各valid entityのshouldListenEventsをデクリメントしてtickが止まるようにする
    this.validEntities.forEach(el => {
      if (typeof el?.shouldListenEvents === 'number') {
	el.shouldListenEvents--;
      }
    });
    this.dummySlots.clear();
    this.relativeTransforms.clear();
  }
});

AFRAME.registerComponent('reserve-multiple-together', {
  schema: {
    targets: { type: 'array', default: [] } // 例: ["obj1", "obj2"]
  },
  init: function() {
    const registerRobotFunc = () => {
      const id = this.el?.id;
      const el = this.el;
      const robotRegistryComp = el.sceneEl.robotRegistryComp;
      if (robotRegistryComp.get(id)) {
	globalThis.__customLogger?.warn('robot:',id,'already registered');
      }
      const axes = [];
      const realAxes = [];
      const endLinkEl = el;
      customLogger?.warn('reserve-multiple-together: registerRobotFunc id=', id,
			  'el=', el, 'axes=', axes, 'endLinkEl=', endLinkEl);
      robotRegistryComp.newId(id, {el: el, axes: axes, endLink: endLinkEl});
      globalThis.__customLogger?.debug('#><><><# planeEl.id:',el?.id,
				       'endLinkEl:',el.endLink);
      globalThis.__customLogger?.debug('######## ', id,
				       ' registered with axes(length):',
				       Object.keys(axes).length,
				       'endLink(id):', endLinkEl.id);
      el.axes = axes;
      el.realAxes = realAxes;
      el.endLink = endLinkEl;
      el.emit('robot-registered', {id, axes, endLinkEl}, false);
    };
    const onDomReady = () => {
      const setRemoveFunc = () => {
	globalThis.__customLogger?.warn('### ', this.el.id,
					'shouldListenEvents changed to',
					this.el?.shouldListenEvents);
	if (this.el?.shouldListenEvents > 0) {
	  this.el.setAttribute('multiple-together',
			       {targets: this.data.targets});
	} else {
	  this.el.removeAttribute('multiple-together');
	}
      };
      this.setRemoveFunc = setRemoveFunc;
      // should-listen-event-changed eventは、robotRegistryのenableEventDeliveryとdisableEventDeliveryを使ってtarget-selectorから間接的にemitされる
      this.el.addEventListener('should-listen-event-changed', setRemoveFunc);
      // setRemoveFunc();
      registerRobotFunc();
    };
    if (this.el.sceneEl.hasLoaded) {
      onDomReady();
    } else {
      this.el.sceneEl.addEventListener('loaded', onDomReady, { once: true });
    }
  },
  remove: function() {
    this.el.removeEventListener('should-listen-event-changed', this.setRemoveFunc);
  }
});
