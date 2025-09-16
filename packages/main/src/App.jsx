// import React, { useEffect, useRef, useState } from 'react'
import { useEffect, useRef } from 'react'
import AFRAME from 'aframe'
const THREE = window.AFRAME.THREE;
import {globalWorkerRef} from './RapierWorker.jsx'
import VrControllerComponents from './VrControllerComponents.jsx'
import './App.css'


// ****************
// the entry point
// :
function App() {
  // ****************
  // Rapier worker
  const workerRef = globalWorkerRef;

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
        <VrControllerComponents />
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

