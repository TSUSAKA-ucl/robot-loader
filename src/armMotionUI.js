
  // motion controller コンポーネントもa-planeに付ける。
  // ただし、別ファイル。poseをevt.detail.targetPoseをrobot-set-targetイベントを発生
  // あるいは、el.workerRef.postMessage(で直接workerに送る
  //
  // motion controllerはvrControllerからeventを受けて
  // trigger on/off に従ってmarker frameとcontroller frameからik-workerの
  // 目標poseを作る。
  // trigger offのときはtickで、marker frameは
  // a) controller frame
  // b) marker frame 
  // c==b) robot destination pose
  // d) robot pose
  // はじめはtrigger offになったら瞬時にc==dにしても良い。いずれcはtrigger offの経過
  // 時間に対して**非線形に**dに近づくようにする。例えば1秒待ってからdとcの偏差をcに
  // フィードバックする。
  // trigger ONのときは、c==bはaの動きを直接反映して(onになるbのポーズをベースに)動く

import AFRAME from 'aframe';
const THREE = window.AFRAME.THREE;
import {isoInvert, isoMultiply} from './isometry3.js';

AFRAME.registerComponent('arm-motion-ui', {
  init: function () {
    this.triggerdownState = false;
    // this.el.laserVisible = true;
    this.vrControllerEl = null;
    this.objStartingPose = [new THREE.Vector3(0,0,0),
                            new THREE.Quaternion(0,0,0,1)];
    this.vrCtrlStartingPoseInv = [new THREE.Vector3(0,0,0),
				  new THREE.Quaternion(0,0,0,1)];

    this.el.addEventListener('triggerdown', (evt) => {
      console.log('### trigger down event. laserVisible: ',
		  evt.detail?.originalTarget.laserVisible);
      this.vrControllerEl = evt.detail?.originalTarget;
      if (!this.vrControllerEl.laserVisible) {
	if (!this.triggerdownState) {
	  this.triggerdownState = true;
	}
      }
    });
    this.el.addEventListener('triggerup', (evt) => {
      console.log('### trigger up event');
      this.vrControllerEl = evt.detail?.originalTarget;
      this.triggerdownState = false;
    });
  },
  tick: function () {
    const ctrlEl = this.vrControllerEl;
    if (!ctrlEl) return;
    if (!this.el.regData) {
      console.warn('not yet registered:', this.el);
      return;
    }
    if (!this.el.regData.workerData ||
	!this.el.regData.workerRef) {
      console.warn('workerData or workerRef not ready yet.');
      return;
    }
    const workerData = this.el.regData.workerData;
    if (! this.triggerdownState || ctrlEl.laserVisible) {
      const ppw = workerData.current.pose.position;
      const qqw = workerData.current.pose.quaternion;
      if (ppw && qqw) {
	const ppt = new THREE.Vector3(ppw[0], ppw[1], ppw[2]);
	const qqt = new THREE.Quaternion(qqw[1], qqw[2], qqw[3], qqw[0]);
	this.objStartingPose = [ppt, qqt];
      }
      this.vrCtrlStartingPoseInv = isoInvert([ctrlEl.object3D.position,
					      ctrlEl.object3D.quaternion]);
    } else if (this.vrControllerEl && this.triggerdownState &&
	       !ctrlEl.laserVisible) {
      const vrControllerPose = [ctrlEl.object3D.position,
				ctrlEl.object3D.quaternion];
      const vrControllerDelta = isoMultiply(this.vrCtrlStartingPoseInv,
                                            vrControllerPose);
      vrControllerDelta[0] = vrControllerDelta[0].multiplyScalar(1.0);
      vrControllerDelta[1].normalize();
      const vrCtrlToObj = [new THREE.Vector3(0, 0, 0),
                           this.vrCtrlStartingPoseInv[1].clone()
                           .multiply(this.objStartingPose[1])];
      const ObjToVrCtrl = [new THREE.Vector3(0, 0, 0),
                           vrCtrlToObj[1].clone().conjugate()];
      const newObjPose = isoMultiply(isoMultiply(this.objStartingPose,
                                                 isoMultiply(ObjToVrCtrl,
                                                             vrControllerDelta)),
                                     vrCtrlToObj);
      this.el.regData.workerRef?.current?.postMessage({
	type: 'destination2',
	endLinkPose: [...newObjPose[0].toArray(), ...newObjPose[1].toArray()]
      });
    }
  }
});

