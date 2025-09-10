import React, { useEffect, useRef, useState } from 'react'
import 'aframe'
const THREE = window.AFRAME.THREE;
import './App.css'

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
  case 'cuboid':
    el = document.createElement('a-box');
    const elAttrs = cuboidAttrs(objDef);
    Object.entries(elAttrs).forEach(([k,v])=>el.setAttribute(k,v));
    break;
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

function App() {
  const frameCounter = useRef(0);
  // ****************
  // Rapier worker
  const workerRef = useRef(null);
  const objectsRef = useRef({});
  const destinationsRef = useRef({});
  useEffect(() => {
    workerRef.current = new Worker('/rapier-worker.mjs', {type: 'module'});
    const worker = workerRef.current;
    worker.onmessage = (e) => {
      switch (e.data.type) {
      case 'definition':
        const el = defineObject(e.data);
        if (el) {
	  objectsRef.current[e.data.id] = el;
          destinationsRef.current[e.data.id] = e.data.pose;
	}
        break;
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
  // Animation loop with Rapier updates
  const reqIdRef = useRef();
  const loop = (timestamp)=>{
    reqIdRef.current = window.requestAnimationFrame(loop) 
    for (const [id, el] of Object.entries(objectsRef.current)) {
      const p = destinationsRef.current[id];
      if (p) {
	el.object3D.position.copy(new THREE.Vector3(p[0], p[1], p[2]));
	el.object3D.quaternion.copy(new THREE.Quaternion(p[4], p[5], p[6], p[3]));
	// if (frameCounter.current < 30) {
	//   console.log(`Obj ${id} pos:`, el.object3D.position);
        // }
      }
    }
    frameCounter.current += 1;
  };
  useEffect(() => {
    loop()
    return () => {
      window.cancelAnimationFrame(reqIdRef.current);
      // workerRef.current?.terminate()
    }
  },[]);

  // ****************
  // Clickable Object
  const startStopButton = useRef(null);
  const stepButton = useRef(null);
  const snapshotButton = useRef(false);
  const resetButton = useRef(null);
  const startStopRef = useRef(false);
  useEffect(()=>{
    const startStopEl = startStopButton.current;
    if (!startStopEl) return;
    const handleClick = (evt) => {
      startStopEl.setAttribute('color', '#'+(Math.random()*0xFFFFFF<<0).toString(16).padStart(6,'0'));
      console.log('start/stop clicked!', evt);
      if (!startStopRef.current) {
        workerRef.current?.postMessage({type: 'start'});
        startStopRef.current = true;
      } else {
        workerRef.current?.postMessage({type: 'stop'});
	startStopRef.current = false;
      }
    };
    startStopEl.addEventListener('click',handleClick);

    // const buttonDef = {'step': stepButton, 'reset': resetButton};
    // Object.entries(buttonDef).forEach(([type,ref])=>{
    //   const btnEl = ref.current;
    //   if (btnEl) {
    //     btnEl.setAttribute('class','clickable');
    //     btnEl.setAttribute('cursor','pointer');
    //     // btnEl.setAttribute('raycaster','objects: .clickable');
    //     const handleBtnClick = (evt) => {
    //       btnEl.setAttribute('color', '#'+(Math.random()*0xFFFFFF<<0).toString(16).padStart(6,'0'));
    //       if (type !== 'step') console.log(`${type} button clicked!`, evt);
    //       workerRef.current?.postMessage({type: type});
    // 	};
    //     btnEl.addEventListener('click',handleBtnClick);
    //   }
    // });
        
    const stepEl = stepButton.current;
    if (stepEl) {
      const handleStepClick = (evt) => {
    	stepEl.setAttribute('color', '#'+(Math.random()*0xFFFFFF<<0).toString(16).padStart(6,'0'));
    	// console.log('Step button clicked!', evt);
    	workerRef.current?.postMessage({type: 'step'});
      };
      stepEl.addEventListener('click',handleStepClick);
    }

    const resetEl = resetButton.current;
    if (resetEl) {
      const handleResetClick = (evt) => {
        resetEl.setAttribute('color', '#'+(Math.random()*0xFFFFFF<<0).toString(16).padStart(6,'0'));
        console.log('Reset button clicked!', evt);
        workerRef.current?.postMessage({type: 'reset'});
      }
      resetEl.addEventListener('click',handleResetClick);
    }

    return () => {
      startStopEl.removeEventListener('click', handleClick);
    };
  },[]);

  return (
    <>
      <a-scene>
        <a-entity camera position="0 1.6 2.0" look-controls="enabled: false"></a-entity>
        {/* clickableをvr以外でclickするには、ここが重要: シーン直下に cursor */}
        <a-entity cursor="rayOrigin: mouse"
                  raycaster="objects: .clickable"></a-entity>
        <a-sphere ref={startStopButton} class="clickable"
          position="0 1.25 -10" radius="1.25" color="#EF2D5E"></a-sphere>
        <a-sphere ref={stepButton} class="clickable"
          position="0 3.25 -10" radius="0.75" color="#4CC3D9"></a-sphere>
	<a-sphere ref={resetButton} class="clickable"
          position="0 4.50 -10" radius="0.5" color="#7BC8A4"></a-sphere>
        <a-cylinder position="1 0.75 -3"
                    radius="0.5" height="1.5" color="#FFC65D"></a-cylinder>
        <a-sky color="#ECECEC"></a-sky>
    </a-scene>
    </>
  )
}

export default App
