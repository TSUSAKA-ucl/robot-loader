import { useEffect, useRef } from 'react'
import 'aframe'
import {globalWorkerRef} from './RapierWorker.jsx'

// ****************
// the entry point
// :
function ButtonUI() {
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
      console.debug('start/stop button clicked! event:', evt);
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
      console.debug('Step button clicked! ', evt);
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
      <a-sphere ref={startStopButton} class="clickable"
                position="0 0.3 -4" radius="0.3" color="#EF2D5E"></a-sphere>
      <a-sphere ref={stepButton} class="clickable"
                position="0 0.8 -4" radius="0.2" color="#4CC3D9"></a-sphere>
      <a-sphere ref={resetButton} class="clickable"
                position="0 1.1 -4" radius="0.1" color="#7BC8A4"></a-sphere>
    </>
  )
}

export default ButtonUI
