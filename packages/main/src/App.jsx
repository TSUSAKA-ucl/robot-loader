import React, { useEffect, useRef, useState } from 'react'
import 'aframe'
const THREE = window.AFRAME.THREE;
import './App.css'

function App() {
  // const [count, setCount] = useState(0)
  const frameCounter = useRef(0);
  // ****************
  // Rapier worker
  const workerRef = useRef(null);
  const boxRef = useRef(null);
  const boxPose = useRef(null);
  useEffect(() => {
    workerRef.current = new Worker('/rapier-worker.mjs', {type: 'module'});
    const worker = workerRef.current;
    worker.onmessage = (e) => {
      if (e.data.type === 'poses') {
        if (e.data.body === 'box1') {
          boxPose.current = e.data.pose;
          // console.log("Positions:", e.data.pose[0], e.data.pose[1]);
        }
      }
    };

    worker.postMessage({ type: "init", bodies: [] });
    // setInterval(() => worker.postMessage({ type: "step" }), 16);
  }, []);

  // ****************
  // Animation loop
  const reqIdRef = useRef();
  const loop = (timestamp)=>{
    reqIdRef.current = window.requestAnimationFrame(loop) 
    const boxEl = boxRef.current;
    if (boxEl) {
      const obj = boxEl.object3D;
      const p = boxPose.current;
      if (p) {
        obj.position.copy(new THREE.Vector3(p[0], p[1], p[2]));
        obj.quaternion.copy(new THREE.Quaternion(p[4], p[5], p[6], p[3]));
        if (frameCounter.current < 30) {
          console.log("Box pos:", p[0], p[1], p[2]);
	}
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
  // box click!
  useEffect(()=>{
    const boxEl = boxRef.current;
    if (!boxEl) return;
    const handleClick = (evt) => {
      console.log('Box clicked!', evt);
    };
    boxEl.addEventListener('click',handleClick);

    boxEl.object3D.position.set(-1,2.0,-3);
    boxEl.object3D.quaternion.copy(new THREE.Quaternion(0,0,0.130526,0.991445));
    return () => {
      boxEl.removeEventListener('click', handleClick);
    };
  },[]);

  return (
    <>
      <a-scene>
        <a-entity camera position="0 1.6 0" look-controls="enabled: false"></a-entity>
        {/* ここが重要: シーン直下に cursor */}
        <a-entity cursor="rayOrigin: mouse"
                  raycaster="objects: .clickable"></a-entity>
        <a-box ref={boxRef} class="clickable"
               width="1.0" height="1.2" depth="0.4"
               color="#4CC3D9"></a-box>
        <a-sphere position="0 1.25 -5" radius="1.25" color="#EF2D5E"></a-sphere>
        <a-cylinder position="1 0.75 -3"
                    radius="0.5" height="1.5" color="#FFC65D"></a-cylinder>
        <a-plane position="0 0.1 -4" rotation="-90 0 0"
                 width="5" height="5" color="#7BC8A4"></a-plane>
        <a-sky color="#ECECEC"></a-sky>
    </a-scene>
    </>
  )
}

export default App
