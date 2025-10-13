import AFRAME from 'aframe';
const THREE = window.AFRAME.THREE;
import {isoInvert, isoMultiply} from './isometry3.js';
import './armMotionUI.js';

AFRAME.registerComponent('arm-motion-ui', {
  init: function () {
    const frameMarker = document.createElement('a-entity');
    frameMarker.setAttribute('a-axes-frame', {
      length: 0.2,
      radius: 0.02,
      sphere: 0.05,
      color: 'blue'
    });
    this.el.appendChild(frameMarker);
    this.frameMarker = frameMarker;
    frameMarker.object3D.visible = true;
    frameMarker.object3D.position.copy(new THREE.Vector3(0,1,0));
    //
    //
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
    this.pptPrev = new THREE.Vector3();
    this.qqtPrev = new THREE.Quaternion();
  },

  // ********
  tick: function () {
    const ctrlEl = this.vrControllerEl;
    if (!ctrlEl) return;
    if (!this.el.workerData ||
	!this.el.workerRef) {
      console.warn('workerData or workerRef not ready yet.');
      return;
    }
    const workerData = this.el.workerData;
    if (! this.triggerdownState || ctrlEl.laserVisible) {
      const ppw = workerData.current.pose.position;
      const qqw = workerData.current.pose.quaternion;
      if (ppw && qqw) {
	const ppt = new THREE.Vector3(ppw[0], ppw[1], ppw[2]);
	const qqt = new THREE.Quaternion(qqw[1], qqw[2], qqw[3], qqw[0]);
	this.objStartingPose = [ppt, qqt];
	this.frameMarker.object3D.position.copy(ppt);
	this.frameMarker.object3D.quaternion.copy(qqt);
	if (!this.pptPrev.equals(ppt) || !this.qqtPrev.equals(qqt)) {
	  console.warn('frameMarker:',this.frameMarker,
		       'pos:',ppw, 'ori:',qqw);
	}
	this.pptPrev = ppt;
	this.qqtPrev = qqt;
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
      this.el.workerRef?.current?.postMessage({
	type: 'destination2',
	endLinkPose: [...newObjPose[0].toArray(), ...newObjPose[1].toArray()]
      });
    }
  }
});



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

