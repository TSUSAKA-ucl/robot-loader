import React, { useEffect, useRef, useState } from 'react'
import 'aframe'
const THREE = window.AFRAME.THREE;
import './App.css'

function cuboidAttrs(objDef) {
  const attrs = {};
  if (objDef.size) {
    attrs.width = objDef.size.x;
    attrs.height = objDef.size.y;
    attrs.depth = objDef.size.z;
  } else {
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
  // const [count, setCount] = useState(0)
  const frameCounter = useRef(0);
  // ****************
  // Rapier worker
  const workerRef = useRef(null);
  const objectsRef = useRef({});
  const destinationsRef = useRef({});
  const clickableRef = useRef(null);
  const boxRef = useRef(null);
  const boxRef2 = useRef(null);
  const boxPose = useRef(null);
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
        if (e.data.body) {
          destinationsRef.current[e.data.body] = e.data.pose;
          // console.log("Positions:", e.data.pose[0], e.data.pose[1]);
        }
        break;
      }
    };
    // worker.postMessage({ type: "init", bodies: [] });
    // setInterval(() => worker.postMessage({ type: "step" }), 16);
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
  // Animation loop
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
  // // ****************
  // // box generation in a-frame
  // useEffect(() => {
  //   const sceneEl = document.querySelector('a-scene');
  //   if (!sceneEl) return;
  //   const box2 = document.createElement('a-box');
  //   const box2attrs = {width:0.5, height:0.5, depth:0.5, color:'tomato',
  //                      position:'1 4 -3', class:'clickable'};
  //   Object.entries(box2attrs).forEach(([k,v])=>box2.setAttribute(k,v));
  //   sceneEl.appendChild(box2);
  //   boxRef2.current = box2;
  //   return () => {
  //     sceneEl.removeChild(box2);
  //     boxRef2.current = null;
  //   }
  // },[]);
  // ****************
  // click! clickable object
  useEffect(()=>{
    const clickEl = clickableRef.current;
    if (!clickEl) return;
    const handleClick = (evt) => {
      clickEl.setAttribute('color', '#'+(Math.random()*0xFFFFFF<<0).toString(16).padStart(6,'0'));
      console.log('Box clicked!', evt);
    };
    clickEl.addEventListener('click',handleClick);

    // clickEl.object3D.position.set(-1,2.0,-3);
    // clickEl.object3D.quaternion.copy(new THREE.Quaternion(0,0,0.130526,0.991445));
    return () => {
      clickEl.removeEventListener('click', handleClick);
    };
  },[]);

  return (
    <>
      <a-scene>
        <a-entity camera position="0 1.6 0" look-controls="enabled: false"></a-entity>
        {/* ここが重要: シーン直下に cursor */}
        <a-entity cursor="rayOrigin: mouse"
                  raycaster="objects: .clickable"></a-entity>
        <a-sphere ref={clickableRef} class="clickable"
          position="0 1.25 -10" radius="1.25" color="#EF2D5E"></a-sphere>
        <a-cylinder position="1 0.75 -3"
                    radius="0.5" height="1.5" color="#FFC65D"></a-cylinder>
        <a-sky color="#ECECEC"></a-sky>
    </a-scene>
    </>
  )
}

export default App

// // 元の色
// const color = new THREE.Color("#7BC8A4");
// // HSL取得
// const hsl = {};
// color.getHSL(hsl);
// // 明度だけ半分に
// color.setHSL(hsl.h, hsl.s, hsl.l * 0.5);
// // A-Frame要素に反映（hexに戻して渡す）
// box.setAttribute("material", { color: `#${color.getHexString()}` });
