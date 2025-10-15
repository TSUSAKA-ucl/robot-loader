import AFRAME from 'aframe';
const THREE = window.AFRAME.THREE;
import {isoInvert, isoMultiply} from './isometry3.js';

function workerPose(el) {
  const pose = el?.workerData?.current?.pose;
  if (pose) {
    const ppw = pose?.position;
    const qqw = pose?.quaternion;
    if (ppw && qqw) {
      const ppt = new THREE.Vector3(ppw[0], ppw[1], ppw[2]);
      const qqt = new THREE.Quaternion(qqw[1], qqw[2], qqw[3], qqw[0]);
      return [ppt,qqt];
    }
  }
  return null;
}

AFRAME.registerComponent('arm-motion-ui', {
  init: function () {
    const myColor = this.el.getAttribute('material').color;
    const frameMarker = document.createElement('a-entity');
    frameMarker.setAttribute('a-axes-frame', {
      length: 0.10,
      radius: 0.005,
      sphere: 0.02,
      color: myColor ? myColor : 'blue',
    });
    this.el.appendChild(frameMarker);
    this.frameMarker = frameMarker;
    frameMarker.object3D.visible = true;
    frameMarker.object3D.position.copy(new THREE.Vector3(0,1,0));
    //
    //
    this.triggerdownState = false;
    this.vrControllerEl = null;
    this.objStartingPose = [new THREE.Vector3(0,0,0),
                            new THREE.Quaternion(0,0,0,1)];
    this.vrCtrlStartingPoseInv = [new THREE.Vector3(0,0,0),
				  new THREE.Quaternion(0,0,0,1)];
    this.worldToBase = [this.el.object3D.position,
			this.el.object3D.quaternion];
    this.baseToWorld = isoInvert(this.worldToBase);

    this.el.addEventListener('triggerdown', (evt) => {
      console.log('### trigger down event. laserVisible: ',
		  evt.detail?.originalTarget.laserVisible);
      const ctrlEl = evt.detail?.originalTarget;
      this.vrControllerEl = ctrlEl;
      if (!this.vrControllerEl.laserVisible) {
	if (this?.returnTimerId) clearTimeout(this.returnTimerId);
	this.triggerdownState = true;
	const iso3 = workerPose(this.el);
	if (iso3 && ctrlEl) {
	  this.objStartingPose = iso3;
	  this.vrCtrlStartingPoseInv
	    = isoMultiply(isoInvert([ctrlEl.object3D.position,
				     ctrlEl.object3D.quaternion]),
			  this.worldToBase);
	}
      }
    });
    this.el.addEventListener('triggerup', (evt) => {
      console.log('### trigger up event');
      this.vrControllerEl = evt.detail?.originalTarget;
      this.triggerdownState = false;

      const iso3 = workerPose(this.el);
      if (iso3) {
	const frameMarkerResetFunc = () => {
	  this.frameMarker.object3D.position.copy(iso3[0]);
	  this.frameMarker.object3D.quaternion.copy(iso3[1]);
	}
	this.returnTimerId = setTimeout(frameMarkerResetFunc, 2000);
      }
    });
    this.pptPrev = new THREE.Vector3();
    this.qqtPrev = new THREE.Quaternion();
  },

  // ********
  tick: function () {
    if (!this.el?.shouldListenEvents) return;
    const ctrlEl = this?.vrControllerEl;
    if (!ctrlEl || !this.el.workerData || !this.el.workerRef) {
      console.warn('workerData, workerRef or controller not ready yet.');
      return;
    }
    if (this.triggerdownState && ~ctrlEl.laserVisible) {
      const vrControllerPose = isoMultiply(this.baseToWorld,
					   [ctrlEl.object3D.position,
					    ctrlEl.object3D.quaternion]);
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
      this.frameMarker.object3D.position.copy(newObjPose[0]);
      this.frameMarker.object3D.quaternion.copy(newObjPose[1]);
      const m4 = new THREE.Matrix4();
      m4.compose(newObjPose[0], newObjPose[1], new THREE.Vector3(1,1,1));
      this.el.workerRef?.current?.postMessage({	type: 'destination',
						endLinkPose: m4.elements
					      });
    }
  }
});
