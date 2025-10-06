import AFRAME from 'aframe'
const THREE = window.AFRAME.THREE;
import {globalWorkerRef, globalObjectsRef} from '@ucl-nuee/rapier-worker'

let controllerPosition = null;
let controllerQuaternion = null;
export let frameObject3D = null;

AFRAME.registerComponent('right-controller-frame', {
  init() {
    frameObject3D = this.el.object3D;
  },
  tick() {
    if (controllerPosition && controllerQuaternion) {
      this.el.object3D.position.copy(controllerPosition);
      this.el.object3D.quaternion.copy(controllerQuaternion);
    }
  }
});

AFRAME.registerComponent('motion-controller', {
  init: function () {
    this.triggerdownState = false;
    this.el.laserVisible = true;
    this.objStartingPose = [new THREE.Vector3(0,0,0),
                            new THREE.Quaternion(0,0,0,1)];
    this.vrCtrlStartingPoseInv = [new THREE.Vector3(0,0,0),
				  new THREE.Quaternion(0,0,0,1)];

    this.el.addEventListener('triggerdown', () => {
      console.log('### trigger down event: laserVisible:', this.el.laserVisible);
      if (!this.el.laserVisible) {
	if (!this.triggerdownState) {
	  this.triggerdownState = true;
	}
      }
    });
    this.el.addEventListener('triggerup', () => {
      console.log('### trigger up event');
      this.triggerdownState = false;
    });
  },
  tick: function () {
    controllerPosition = this.el.object3D.position;
    controllerQuaternion = this.el.object3D.quaternion;
    if (!globalObjectsRef) {
      console.warn('globalObjectsRef not ready yet.');
      return;
    }
    const movingObj = globalObjectsRef.current['hand1'];
    if (!movingObj) {
      console.warn('hand1 object not found');
      return;
    }
    if (! this.triggerdownState || this.el.laserVisible) {
      this.objStartingPose = [movingObj.object3D.position.clone(),
			      movingObj.object3D.quaternion.clone()];
      this.vrCtrlStartingPoseInv = isoInvert([this.el.object3D.position,
					      this.el.object3D.quaternion]);
    } else {
      const vrControllerPose = [this.el.object3D.position,
				this.el.object3D.quaternion];
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

// *****************
// isometry multiplication function isoMultiply(a, b) 
// a = [p, q] where p: THREE.Vector3, q: THREE.Quaternion
function isoMultiply(a, b) {
  const p = a[0];
  const q = a[1];
  const r = b[0];
  const s = b[1];
  const p2 = new THREE.Vector3();
  p2.copy(r);
  p2.applyQuaternion(q);
  p2.add(p);
  const q2 = new THREE.Quaternion();
  q2.copy(q);
  q2.multiply(s);
  return [p2, q2];
}
function isoInvert(a) {
  const p = a[0];
  const q = a[1];
  const q2 = new THREE.Quaternion();
  q2.copy(q);
  q2.conjugate();
  const p2 = new THREE.Vector3();
  p2.copy(p);
  p2.negate();
  p2.applyQuaternion(q2);
  return [p2, q2];
}
