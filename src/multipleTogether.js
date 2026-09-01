import {customLogger} from './customLogger.js'
globalThis.__customLogger = customLogger;
import AFRAME from 'aframe';
const THREE = window.AFRAME.THREE;
import { VR_EVENTS } from './vrControllerEvents.js'
import {newObjPoseConstsWorld, newObjPoseUI} from './newObjPoseUI.js'

// schemaで複数のentityのidを引数にとる
// それらがloadedになった時にarm-motion-uiコンポーネントが付いているかどうか確認して
// 付いていないentityは、このあと全て無視。付いているentityに対応して
// ダミーコントローラー(el風の単なるTHREEのobject3D用のスロットだけ持つJavaScriptオブジェクト予定だが当面はa-entity)を作る
// ダミーコントローラーの親はワールドで良い
// このmultiple-togetherコンポーネントがvrController(event-distributorコンポーネント)からの
// イベントを受け取ったら、以下を行う。
// 1. 現在のthis.el.object3Dを、全schemaのel.endlinkの平均的な位置姿勢に書き換え
// 2. ダミーコントローラーのobject3Dを現在のschemaリストのel.endlinkのobject3Dと一致させる
// 4. evt.detail?.originalTargetを、リストのentityに対応するダミーコントローラーのに書き換えてschemaのリストのentityに投げる(emit)
// 5. tickで、this.elはvrControllerの相対位置姿勢アルゴリズムで移動しダミーコントローラーのobject3Dは自動的に追従する
AFRAME.registerComponent('multiple-together', {
  schema: {
    targets: { type: 'array', default: [] } // 例: ["obj1", "obj2"]
  },
  // arm-motion-uiのtickがここのdummySlotのobject3Dを見る前にこのコンポーネントが
  // newObjPoseUI()でthis.el.object3Dの位置姿勢を更新しておく必要があるのでbeforeに指定
  before: ['arm-motion-ui'],
  init: function () {
    this.validEntities = [];
    this.originalProperties = new WeakMap();
    this.dummySlots = new Map(); // entityId -> { object3D, el }
    // this.relativeTransforms = new Map(); // entityId -> { position, quaternion }
    this.backupMasterController = new WeakMap();

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
    globalThis.__customLogger?.log('multiple-together: setupTargets', 'targets:', this.data.targets);
    const promises = this.data.targets.map(selector => {
      globalThis.__customLogger?.log('multiple-together: setupTargets', 'selector:', selector);
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
      globalThis.__customLogger?.log('multiple-together: setupTargets', entities.map(el => el?.id).join(', '));
      // arm-motion-ui が付いているEntityのみを抽出
      this.validEntities = entities.filter(el => el && el.components['arm-motion-ui']);

      // ターゲットごとに超軽量なダミーオブジェクトを作成
      this.validEntities.forEach(el => {
	// worldDirect schemaを保存する
	this.originalProperties.set(el, { worldDirect: el.getAttribute('arm-motion-ui').worldDirect });
        el.setAttribute('arm-motion-ui', 'worldDirect', true); // ダミーコントローラーの一時的モード変更
        // const dummyObject3D = new THREE.Object3D();
        // // 最小限のダミー構造（DOMを作らない）
        // const dummySlot = {
        //   object3D: dummyObject3D,
        //   // arm-motion-ui 側で originalTarget.el.object3D や originalTarget.object3D
        //   // どちらのアクセス方法でもエラーにならないためのダミー参照
	//   laserVisible: false,
        //   el: null 
        // };
        // dummySlot.el = dummySlot;
        const dummySlot = document.createElement('a-entity');
        dummySlot.setAttribute('a-axes-frame', 'color: blue; length: 0.1; radius: 0.003; sphere: 0.02');
        dummySlot.setAttribute('color', 'blue');
        dummySlot.setAttribute('scale', '0.5 0.5 0.5');
        this.el.appendChild(dummySlot);
        dummySlot.laserVisible = false;
        dummySlot.object3D.position.set(0, 0, 0);
        dummySlot.object3D.quaternion.set(0, 0, 0, 1);
        dummySlot.object3D.scale.set(1, 1, 1);
        dummySlot.object3D.updateMatrixWorld();
        dummySlot.el = null;
        dummySlot.correspondingEntityId = el.id;
        this.dummySlots.set(el.id, dummySlot);

	// 各valid entityのtickが動き出すように shouldListenEvents をインクリメント
	if (typeof el?.shouldListenEvents === 'number') {
	  el.shouldListenEvents++;
	}
	this.backupMasterController.set(el, el.masterController);
	el.masterController = dummySlot;
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
      el.endLink.object3D.getWorldPosition(this.targetWorldPos);
      el.endLink.object3D.getWorldQuaternion(this.targetWorldRot);
      avgPos.add(this.targetWorldPos);
      quaternions.push(this.targetWorldRot.clone());
    });
    avgPos.divideScalar(this.validEntities.length);

    // 簡易的な平均回転の適用
    const avgRot = quaternions[0];

    // 一時的にdummySlotsをワールドに移動して、this.el.object3Dの位置姿勢を自由に変更できるようにする
    // 対応するvalidEntitiesのendLink.object3Dのworld値とdummySlotのworld値を一致させる
    this.dummySlots.forEach(dummySlot => {
      this.el.sceneEl.object3D.attach(dummySlot.object3D);
      const correspondingEntity = this.validEntities.find(el => el.id === dummySlot.correspondingEntityId);
      if (correspondingEntity) {
        dummySlot.object3D.position.copy(correspondingEntity.endLink.object3D.getWorldPosition(new THREE.Vector3()));
        dummySlot.object3D.quaternion.copy(correspondingEntity.endLink.object3D.getWorldQuaternion(new THREE.Quaternion()));
        dummySlot.object3D.updateMatrixWorld();
      }
    });
    // this.el.object3D を平均位置・姿勢に移動
    this.el.object3D.position.copy(avgPos);
    this.el.object3D.quaternion.copy(avgRot);
    this.el.object3D.updateMatrixWorld();
    // dummySlotsのTHREE.object3Dをthis.el.object3Dの子にする
    this.dummySlots.forEach(dummySlot => {
      this.el.object3D.attach(dummySlot.object3D);
    });
    // arm-motion-uiはworldDirect:trueにしているのでdummySlotsのobject3Dのワールド位置姿勢がそのまま目標値になる

    this.vrControllerEl = evt.detail?.originalTarget;
    newObjPoseConstsWorld(this, this.vrControllerEl,
			  this.el,
			  this.el.sceneEl.camera.position);
    this.triggerdownState = true;
  },

  onVREvents: function (evt) {
    globalThis.__customLogger?.log('multiple-together: onVREvents', evt.type,
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
      globalThis.__customLogger?.log('multi: emit: type:',evt.type,
				      'to id:', el.id);
      el.emit(evt.type, newDetail, false);
    });
  },

  tick: function () {
    if (this.el?.shouldListenEvents && this.vrControllerEl) {
      // this.elは vrControllerElの相対位置姿勢アルゴリズムで移動
      // dummySlotは自動的に追従
      const newPose = newObjPoseUI(this, this.vrControllerEl);
      if (newPose) {
	this.el.object3D.position.copy(newPose[0]);
	this.el.object3D.quaternion.copy(newPose[1]);
      }
    }
    if (this.validEntities.length === 0) return;
    const selfWorldMatrix = this.el.object3D.matrixWorld;
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
	// ダミーコントローラーの一時的モード変更を元に戻す
        el.setAttribute('arm-motion-ui', 'worldDirect', this.originalProperties.get(el)?.worldDirect ?? false);
	this.originalProperties.delete(el);
      }
      el.masterController = this.backupMasterController.get(el);
      this.backupMasterController.delete(el);
    });
    this.dummySlots.forEach(dummySlot => {
      if (dummySlot && dummySlot.parentNode) {
        dummySlot.parentNode.removeChild(dummySlot);
      }
    });
    this.dummySlots.clear();
    // this.relativeTransforms.clear();
    this.validEntities = [];
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
	globalThis.__customLogger?.log('robot:',id,'already registered');
      }
      const axes = [];
      const realAxes = [];
      const endLinkEl = el;
      customLogger?.log('reserve-multiple-together: registerRobotFunc id=', id,
			 // 'el=', el,
			 'axes=', axes, 'endLinkEl.id=', endLinkEl.id);
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
	globalThis.__customLogger?.log(`### "${this.el.id}"s shouldListenEvents is`,
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
