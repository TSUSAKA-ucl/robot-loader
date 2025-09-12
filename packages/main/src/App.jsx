// import React, { useEffect, useRef, useState } from 'react'
import { useEffect, useRef } from 'react'
import AFRAME from 'aframe'
const THREE = window.AFRAME.THREE;
import './App.css'


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



let globalWorkerRef = null;
let globalObjectsRef = null;
let globalDestinationsRef = null;

let globalLaserVisible = true;
AFRAME.registerComponent('laser-controller-right', {
  init: function () {
    this.triggerdownState = false;
    this.objStartingPose = [new THREE.Vector3(0,0,0),
                            new THREE.Quaternion(0,0,0,1)];
    this.vrCtrlStartingPoseInv = [new THREE.Vector3(0,0,0),
				 new THREE.Quaternion(0,0,0,1)];
    // thumbstick push event
    this.el.addEventListener('thumbstickdown', (evt) => {
      // console.log('laser: thumbstick down', evt);
      // Toggle laser visibility
      if (globalLaserVisible) {
        // this.el.setAttribute('visible', false);
        this.el.setAttribute('line', 'visible: false');
        this.el.setAttribute('raycaster', 'enabled', false);
        // this.el.removeAttribute('laser-controls');
        globalLaserVisible = false;
      } else {
        // this.el.setAttribute('visible', true);
        // this.el.setAttribute('laser-controls', 'hand: right');
        this.el.setAttribute('line', 'visible: true');
	this.el.setAttribute('raycaster', 'enabled', true);
        globalLaserVisible = true;
      }
    });
    this.el.addEventListener('thumstickup', (evt) => {
      // console.log('laser: thumbstick up', evt);
    });
  },
});
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
      vrControllerDelta[0] = vrControllerDelta[0].multiplyScalar(5.0);
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


// *****************
// A-Frame component to update the Rapier objects poses
// :
// Even if you update the poses within the requestAnimationFrame
// animation loop, the poses will not be reflected in (only) Quest VR mode,
// so it is recommend to update them using the a-scene tick function.
// :
let globalFrameCounter = null;
AFRAME.registerComponent('update-objects-poses', {
  tick: function () {
    if (globalObjectsRef && globalDestinationsRef) {
      for (const [id, el] of Object.entries(globalObjectsRef.current)) {
        const p = globalDestinationsRef.current[id];
        if (p) {
	  el.object3D.position.copy(new THREE.Vector3(p[0], p[1], p[2]));
	  el.object3D.quaternion.copy(new THREE.Quaternion(p[4], p[5], p[6], p[3]));
	  // if (frameCounter.current < 30) {
	  //   console.log(`Obj ${id} pos:`, el.object3D.position);
          // }
          // el.object3D.updateMatrix();
          // el.object3D.updateMatrixWorld(true);
        }
      }
      if (globalFrameCounter) globalFrameCounter.current += 1;
    }
  }
});

// *****************
// functions to define A-Frame objects from the Rapier object definitions
// they are called when the Rapier worker sends the object definitions
// :
function cuboidAttrs(objDef) {
  const attrs = {};
  if (objDef.size) {
    console.log("Cuboid ", objDef.id, " size:", objDef.size);
    attrs.width = objDef.size.x;
    attrs.height = objDef.size.y;
    attrs.depth = objDef.size.z;
  } else {
    console.warn("Cuboid size not defined, using 1x1x1. Obj:", objDef);
    attrs.width = 1;
    attrs.height = 1;
    attrs.depth = 1;
  }
  attrs.color = objDef.color || 'gray';
  return attrs;
}

function defineObject(objDef) {
  const sceneEl = document.querySelector('a-scene');
  if (!sceneEl) return null;
  let el = null;
  switch (objDef.shape) {
  case 'cuboid': {
    el = document.createElement('a-box');
    el.setAttribute('id', objDef.id);
    const elAttrs = cuboidAttrs(objDef);
    Object.entries(elAttrs).forEach(([k,v])=>el.setAttribute(k,v));
    break;
  }
  default:
    console.warn("Unknown shape:", objDef.shape);
  }
  if (!el) return null;
  if (objDef.pose) {
    el.object3D.position.set(objDef.pose[0], objDef.pose[1], objDef.pose[2]);
    el.object3D.quaternion.set(objDef.pose[4], objDef.pose[5], objDef.pose[6],
                               objDef.pose[3]);
  }
  sceneEl.appendChild(el);
  return el;
}

// ****************
// the entry point
// :
function App() {
  const frameCounter = useRef(0);
  globalFrameCounter = frameCounter;
  // ****************
  // Rapier worker
  const workerRef = useRef(null);
  globalWorkerRef = workerRef;
  const objectsRef = useRef({});
  globalObjectsRef = objectsRef;
  const destinationsRef = useRef({});
  globalDestinationsRef = destinationsRef;
  useEffect(() => {
    workerRef.current = new Worker('/rapier-worker.mjs', {type: 'module'});
    const worker = workerRef.current;
    worker.onmessage = (e) => {
      switch (e.data.type) {
      case 'definition': {
        const el = defineObject(e.data);
        if (el) {
	  objectsRef.current[e.data.id] = el;
          destinationsRef.current[e.data.id] = e.data.pose;
	}
        break;
      }
      case 'poses':
        if (e.data.id && e.data.pose) {
          destinationsRef.current[e.data.id] = e.data.pose;
          // console.log("Positions:", e.data.pose[0], e.data.pose[1]);
        }
        break;
      }
    };
    return () => {
      worker.terminate();
      workerRef.current = null;
      Object.values(objectsRef.current).forEach((el) => {
	if (el.parentNode) {
	  el.parentNode.removeChild(el);
	}
      });
    }
  }, []);
  // ****************
  //   Animation loop without Rapier updates
  // const reqIdRef = useRef();
  // const loop = (timestamp)=>{
  //   reqIdRef.current = window.requestAnimationFrame(loop) 
  //   NOTHING TO DO HERE, poses are updated in the a-scene tick function
  // };
  // useEffect(() => {
  //   loop()
  //   return () => {
  //     window.cancelAnimationFrame(reqIdRef.current);
  //     workerRef.current?.terminate()
  //   }
  // },[]);

  // ****************
  // Clickable Object
  const startStopButton = useRef(null);
  const stepButton = useRef(null);
  // const snapshotButton = useRef(false);
  const resetButton = useRef(null);
  const startStopRef = useRef(false);
  useEffect(()=>{
    function randomColor() {
      return '#'+(Math.random()*0xFFFFFF<<0).toString(16).padStart(6,'0');
    }
    const startStopEl = startStopButton.current;
    const handleClick = startStopEl ? (evt) => {
      startStopEl.setAttribute('color', randomColor());
      console.log('start/stop clicked!', evt);
      if (!startStopRef.current) {
        workerRef.current?.postMessage({type: 'start'});
        startStopRef.current = true;
      } else {
        workerRef.current?.postMessage({type: 'stop'});
	startStopRef.current = false;
      }
    } : null;
    startStopEl?.addEventListener('click',handleClick);

    const stepEl = stepButton.current;
    const handleStepClick = stepEl ? (evt) => {
      // console.log('Step button clicked!', evt);
      stepEl.setAttribute('color', randomColor());
      workerRef.current?.postMessage({type: 'step'});
    } : null;
    stepEl?.addEventListener('click',handleStepClick);

    const resetEl = resetButton.current;
    const handleResetClick = resetEl ? (evt) => {
      resetEl.setAttribute('color', randomColor());
      console.log('Reset button clicked!', evt);
      workerRef.current?.postMessage({type: 'reset'});
    } : null;
    resetEl?.addEventListener('click',handleResetClick);

    return () => {
      startStopEl?.removeEventListener('click', handleClick);
      stepEl?.removeEventListener('click', handleStepClick);
      resetEl?.removeEventListener('click', handleResetClick);
    };
  },[]);

  return (
    <>
      <a-scene update-objects-poses>
        <a-entity camera position="0 1.6 2.0" look-controls="enabled: false"></a-entity>
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
        <a-sphere ref={startStopButton} class="clickable"
          position="0 1.25 -10" radius="1.25" color="#EF2D5E"></a-sphere>
        <a-sphere ref={stepButton} class="clickable"
          position="0 3.25 -10" radius="0.75" color="#4CC3D9"></a-sphere>
	<a-sphere ref={resetButton} class="clickable"
          position="0 4.50 -10" radius="0.5" color="#7BC8A4"></a-sphere>
        <a-cylinder position="1 0.75 -3"
                    radius="0.5" height="1.5" color="#FFC65D"
                    material="opacity: 0.35; transparent: true">
        </a-cylinder>
        <a-sky color="#ECECEC"></a-sky>
    </a-scene>
    </>
  )
}

export default App

