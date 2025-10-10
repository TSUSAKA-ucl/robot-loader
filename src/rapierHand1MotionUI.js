import AFRAME from 'aframe'
const THREE = window.AFRAME.THREE;
import {globalWorkerRef, globalObjectsRef} from '@ucl-nuee/rapier-worker'
import {isoInvert, isoMultiply} from './isometry3.js';

AFRAME.registerComponent('rapier-hand1-motion-ui', {
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
    // controllerPosition = ctrlEl.object3D.position;
    // controllerQuaternion = ctrlEl.object3D.quaternion;
    if (!globalObjectsRef) {
      console.warn('globalObjectsRef not ready yet.');
      return;
    }
    const movingObj = globalObjectsRef.current['hand1'];
    if (!movingObj) {
      console.warn('hand1 object not found');
      return;
    }
    if (! this.triggerdownState || ctrlEl.laserVisible) {
      this.objStartingPose = [movingObj.object3D.position.clone(),
			      movingObj.object3D.quaternion.clone()];
      this.vrCtrlStartingPoseInv = isoInvert([ctrlEl.object3D.position,
					      ctrlEl.object3D.quaternion]);
    } else {
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
      globalWorkerRef?.current?.postMessage({
        type: 'setNextPose',
        id: 'hand1',
	pose: [...newObjPose[0].toArray(), ...newObjPose[1].toArray()]
      });
    }
  }

});
