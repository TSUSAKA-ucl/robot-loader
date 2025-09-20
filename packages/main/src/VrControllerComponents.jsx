// ********
// DO NOT IMPORT THIS FILE FROM MULTIPLE LOCATIONS
// This file defines A-Frame components for VR controller handling directly
// in the main thread, so it should be imported only once.
// ********
import AFRAME from 'aframe'
const THREE = window.AFRAME.THREE;
import {globalWorkerRef, globalObjectsRef} from './RapierWorker.jsx';

let controllerPosition = null;
let controllerQuaternion = null;
let frameObject3D = null;

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

AFRAME.registerComponent('right-controller', {
  init: function () {
    this.triggerdownState = false;
    this.laserVisible = true;
    this.objStartingPose = [new THREE.Vector3(0,0,0),
                            new THREE.Quaternion(0,0,0,1)];
    this.vrCtrlStartingPoseInv = [new THREE.Vector3(0,0,0),
				  new THREE.Quaternion(0,0,0,1)];

    const cylinder = document.createElement('a-cylinder');
    const cylinderHeight = 0.25;
    cylinder.setAttribute('radius', 0.002); // radius
    cylinder.setAttribute('height', cylinderHeight);  // length
    cylinder.setAttribute('color', 'red');
    // cylinder.setAttribute('position', `0 ${-cylinderHeight/2} 0`);
    cylinder.setAttribute('position', '0 0 0');
    cylinder.setAttribute('rotation', '0 0 0');
    // cylinder.setAttribute('position', '-0.01 -0.06 -0.10'); 
    // cylinder.setAttribute('rotation', '57 10.5 0');
    this.el.appendChild(cylinder);
    // this.frame = buildUpFrameAxes(this.el);
    //
    this.el.addEventListener('thumbstickdown', () => {
      // console.log('### detect THUMBSTICK down event');
      const ray = this.el.getAttribute('raycaster').direction;
      const v = new THREE.Vector3(ray.x, ray.y, ray.z).normalize();
      const q = new THREE.Quaternion()
            .setFromUnitVectors(new THREE.Vector3(0,1,0), v);
      const p = new THREE.Vector3(0.005, cylinderHeight*0.5, 0.015);
      cylinder.object3D.quaternion.copy(q);
      cylinder.object3D.position.copy(p.applyQuaternion(q));
      // console.log('ray x,y,z: ', ray.x, ray.y, ray.z);
      //
      this.laserVisible = !this.laserVisible;
      this.el.setAttribute('line', 'visible', this.laserVisible);
      this.el.setAttribute('raycaster', 'enabled', this.laserVisible);
      cylinder.object3D.visible = this.laserVisible;
      frameObject3D.visible = ! this.laserVisible;
      // this.frame.object3D.visible = !this.laserVisible;
    });
    this.el.addEventListener('triggerdown', () => {
      if (!this.laserVisible) this.triggerdownState = true;
    });
    this.el.addEventListener('triggerup', () => {
      this.triggerdownState = false;
    });
  },

  tick: function () {
    controllerPosition = this.el.object3D.position;
    controllerQuaternion = this.el.object3D.quaternion;
    if (!globalObjectsRef) return;
    const movingObj = globalObjectsRef.current['hand1'];
    if (!movingObj) return;
    if (! this.triggerdownState || this.laserVisible) {
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

function VrControllerComponents() {
  // definition of the end link axes marker
  const con_axis_length = 0.100;
  const con_length = (con_axis_length/2).toString();
  const con_hight = (con_axis_length).toString();
  const con_radius = '0.0035';
  const controller_axes = (
    <a-entity right-controller-frame position={'0 1 0'} >
      <a-sphere
        scale="0.012 0.012 0.012"
        color="white"
        visible={true}>
      </a-sphere>
      <a-cylinder position={`${con_length} 0 0`} rotation={`0 0 -90`}
        	  height={con_hight} radius={con_radius} color="red" />
      <a-cylinder position={`0 ${con_length} 0`} rotation={`0 0 0`}
		  height={con_hight} radius={con_radius} material='color: #00ff00' />
      <a-cylinder position={`0 0 ${con_length}`} rotation={`90 0 0`}
        	  height={con_hight} radius={con_radius} color="blue" />
    </a-entity>
  );
  return (
    <>
      <a-entity right-controller
                laser-controls="hand: right"
                raycaster="objects: .clickable"
                line="color: blue; opacity: 0.75"
                visible="true">
      </a-entity>
      {controller_axes}
      <a-entity cursor="rayOrigin: mouse"
                mouse-cursor
                raycaster="objects: .clickable"></a-entity>

    </>
  );
}
//                 oculus-touch-controls="hand: right"

export default VrControllerComponents;
