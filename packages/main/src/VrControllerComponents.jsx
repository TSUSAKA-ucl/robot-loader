// ********
// DO NOT IMPORT THIS FILE FROM MULTIPLE LOCATIONS
// This file defines A-Frame components for VR controller handling directly
// in the main thread, so it should be imported only once.
// ********
import AFRAME from 'aframe'
const THREE = window.AFRAME.THREE;
import {globalWorkerRef, globalObjectsRef} from './RapierWorker.jsx';

// AFRAME.registerComponent('log-pose', {
//   tick: function () {
//     let p = this.el.object3D.position;
//     let q = this.el.object3D.quaternion;
//     document.querySelector('#debugText').setAttribute(
//       'value',
//       `pos=(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})\n` +
//       `rot=(${q.x.toFixed(2)}, ${q.y.toFixed(2)}, ${q.z.toFixed(2)}, ${q.w.toFixed(2)})`
//     );
//   }
// });

let globalLaserVisible = true;

if (!AFRAME.components['laser-controller-right']) {
  console.log("Registering laser-controller-right component");
  AFRAME.registerComponent('laser-controller-right', {
    init: function () {
      this.triggerdownState = false;
      this.objStartingPose = [new THREE.Vector3(0,0,0),
                              new THREE.Quaternion(0,0,0,1)];
      this.vrCtrlStartingPoseInv = [new THREE.Vector3(0,0,0),
				    new THREE.Quaternion(0,0,0,1)];
      const cylinder = document.createElement('a-cylinder');
      cylinder.setAttribute('radius', 0.002); // 半径 (太さ)
      cylinder.setAttribute('height', 0.1);  // 長さ
      cylinder.setAttribute('color', 'red'); // 色
      cylinder.setAttribute('position', '0 0 -0.05'); 
      // コントローラの先端から前方へ伸ばす（height/2 の位置を意識）
      // デフォルトで cylinder はY軸方向に伸びるので、-Z方向へ回す
      cylinder.setAttribute('rotation', '90 0 0');
      this.el.appendChild(cylinder);

      // thumbstick push event
      this.el.addEventListener('thumbstickdown', (evt) => {
	// console.log('laser: thumbstick down', evt);
	// Toggle laser visibility
	if (globalLaserVisible) {
          // this.el.setAttribute('visible', false);
          this.el.setAttribute('line', 'visible: false');
          this.el.setAttribute('raycaster', 'enabled', false);
          // this.el.removeAttribute('laser-controls');
          cylinder.setAttribute('material', 'opacity: 0');
          globalLaserVisible = false;
	} else {
          // this.el.setAttribute('visible', true);
          // this.el.setAttribute('laser-controls', 'hand: right');
          this.el.setAttribute('line', 'visible: true');
	  this.el.setAttribute('raycaster', 'enabled', true);
          cylinder.setAttribute('material', 'color: red; opacity: 0.5');
          globalLaserVisible = true;
	}
      });
      this.el.addEventListener('thumstickup', (evt) => {
	// console.log('laser: thumbstick up', evt);
      });
    },
  });
} else {
  console.log("laser-controller-right component already registered");
}

if (!AFRAME.components['vr-controller-right']) {
  AFRAME.registerComponent('vr-controller-right', {
    init: function () {
      this.el.addEventListener('axismove', (evt) => {});
      //
      this.triggerdownState = false;
      this.el.addEventListener('triggerdown', (evt) => {
	if (!globalLaserVisible) {
          this.triggerdownState = true;
	}
      });
      this.el.addEventListener('triggerup', (evt) => {
	this.triggerdownState = false;
      });
    },
    tick: function () {
      if (!globalObjectsRef) return;
      const movingObj = globalObjectsRef.current['hand1'];
      if (!movingObj) return;
      if (! this.triggerdownState) {
	this.objStartingPose = [movingObj.object3D.position.clone(),
				movingObj.object3D.quaternion.clone()];
	this.vrCtrlStartingPoseInv = isoInvert([this.el.object3D.position,
						this.el.object3D.quaternion]);
      } else {
	this.vrControllerPose = [this.el.object3D.position,
				 this.el.object3D.quaternion];
	const vrControllerDelta = isoMultiply(this.vrCtrlStartingPoseInv,
                                              this.vrControllerPose);
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
	// document.querySelector('#debugText').setAttribute(
	//   'value',
	//   `pos=(${newObjPose[0].x.toFixed(2)}, ${newObjPose[0].y.toFixed(2)}, ${newObjPose[0].z.toFixed(2)})\n` +
	//   `rot=(${q.x.toFixed(2)}, ${q.y.toFixed(2)}, ${q.z.toFixed(2)}, ${q.w.toFixed(2)})`
	// );
	if (globalWorkerRef) {
          globalWorkerRef.current
          ?.postMessage({type: 'setNextPose',
			 id: 'hand1',
			 pose: [...newObjPose[0].toArray(),
				...newObjPose[1].toArray()]});
	}
      }
    }
  });
} else {
  console.log("vr-controller-right component already registered");
}

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
  return (
    <>
      <a-entity id="hand_r" oculus-touch-controls="hand: right"
          	vr-controller-right
                /* log-pose */
                visible="true"></a-entity>
      {/* <a-text id="debugText" value="waiting..." */}
      {/*         position="0 2 -2" color="yellow"></a-text> */}
      <a-entity laser-controls="hand: right"
                laser-controller-right
                raycaster="objects: .clickable"
                line="color: blue; opacity: 0.75"
                visible="false"></a-entity>
      clickableをvr以外でclickするには、ここが重要: シーン直下に cursor
      <a-entity cursor="rayOrigin: mouse"
                mouse-cursor
                raycaster="objects: .clickable"></a-entity>

    </>
  );
}

export default VrControllerComponents;
