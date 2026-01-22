import AFRAME from 'aframe';
const THREE = window.AFRAME.THREE;
import {isoInvert, isoMultiply} from './isometry3.js';
import {registerResetTarget} from './attachToAnother.js';

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

// this component is indended to be attached to an robot-plane
AFRAME.registerComponent('arm-motion-ui', {
  setStartPoseAndRatio: function (objectPose) {
    // Before enter this function, this.worldToBase must ALREADY be
    // calculated and this.vrControllerEl must be set. In this
    // function, this.objStartingPose, this.vrCtrlStartingPoseInv and
    // this.ratio are set.
    this.objStartingPose = objectPose;
    this.vrCtrlStartingPose = [this.vrControllerEl.object3D.position,
			       this.vrControllerEl.object3D.quaternion];
    const vrCtrlPosition = this.vrCtrlStartingPose[0]
    this.vrCtrlStartingPoseInv
      = isoMultiply(isoInvert(this.vrCtrlStartingPose),
		    this.worldToBase);
    const activeCamera = this.el.sceneEl?.camera;
    const cameraPosition = new THREE.Vector3();
    activeCamera.getWorldPosition(cameraPosition);
    const distance1 = cameraPosition.distanceTo(objectPose[0]);
    const distance2 = cameraPosition.distanceTo(vrCtrlPosition)
    this.ratio = distance1/distance2;
    this.resetTimeDelta = 0;
    // console.debug('MMMMM ctrlStartInv:',this.vrCtrlStartingPoseInv[0]
    // 		 // , this.vrCtrlStartingPoseInv[1]
    // 		 ,' objStart:',this.objStartingPose[0]
    // 		 // ,this.objStartingPose[1]
    // 		);
  },
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
    this.ratio = 1;
    this.obj = this.el.object3D;
    this.obj.updateMatrixWorld(true);
    const m = this.obj.matrixWorld;
    const pos = new THREE.Vector3().setFromMatrixPosition(m);
    const quat = new THREE.Quaternion().setFromRotationMatrix(m);
    this.worldToBase = [ pos, quat ];
    this.baseToWorld = isoInvert(this.worldToBase);

    this.el.addEventListener('triggerdown', (evt) => {
      evt.stopPropagation();
      console.log('### trigger down event. laserVisible: ',
		  evt.detail?.originalTarget.laserVisible);
      const ctrlEl = evt.detail?.originalTarget;
      this.vrControllerEl = ctrlEl;
      if (!this.vrControllerEl.laserVisible) {
	if (this?.returnTimerId) clearTimeout(this.returnTimerId);
	this.triggerdownState = true;
 	const iso3 = workerPose(this.el);
	if (iso3) {
	  this.frameMarker.object3D.position.copy(iso3[0]);
	  this.frameMarker.object3D.quaternion.copy(iso3[1]);
	  if (ctrlEl) {
	    this.obj.updateMatrixWorld(true);
	    const m = this.obj.matrixWorld;
	    const pos = new THREE.Vector3().setFromMatrixPosition(m);
	    const quat = new THREE.Quaternion().setFromRotationMatrix(m);
	    this.worldToBase = [ pos, quat ];
	    this.baseToWorld = isoInvert(this.worldToBase);
	    this.setStartPoseAndRatio(iso3);
	  }
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
    registerResetTarget(this);
  },

  // ********
  tick: function (time, timeDelta) {
    this.resetTimeDelta += timeDelta;
    if (!this.el?.shouldListenEvents) {
      this.triggerdownState = false;
      return;
    }
    const ctrlEl = this?.vrControllerEl;
    if (ctrlEl && 'laserVisible' in ctrlEl && !ctrlEl.laserVisible) {
      if (!this.el.workerData || !this.el.workerRef) {
	console.warn('workerData or workerRef not ready yet.');
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
	newObjPose[1].normalize();
	this.frameMarker.object3D.position.copy(newObjPose[0]);
	this.frameMarker.object3D.quaternion.copy(newObjPose[1]);
	const m4 = new THREE.Matrix4();
	m4.compose(newObjPose[0], newObjPose[1], new THREE.Vector3(1,1,1));
	this.el.workerRef?.current?.postMessage({	type: 'destination',
							endLinkPose: m4.elements
						});
	if (this.resetTimeDelta > 100.0) {
	  const m = this.obj.matrixWorld;
	  const pos = new THREE.Vector3().setFromMatrixPosition(m);
	  const quat = new THREE.Quaternion().setFromRotationMatrix(m);
	  this.worldToBase = [ pos, quat ];
	  this.baseToWorld = isoInvert(this.worldToBase);
	  this.setStartPoseAndRatio(newObjPose)
	}
      }
    }
  }
});
