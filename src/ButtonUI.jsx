import { useEffect, useRef } from 'react';
import AFRAME from 'aframe';
const THREE = AFRAME.THREE;
import {globalWorkerRef} from '@ucl-nuee/rapier-worker';
import {rgbToHsv, hsvToRgb} from './hsvToRgb.js';

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
    function darkColor(colorText) {
      const color = new THREE.Color(colorText);
      console.log('darkColor input:', colorText, 'parsed:', color);
      const [h,s,v] = rgbToHsv(color.r, color.g, color.b);
      const v2 = v/2;
      const [r,g,b] = hsvToRgb(h,s,v2);
      const newColor = new THREE.Color(r,g,b);
      console.log('darkColor output:', '#'+newColor.getHexString(), 'parsed:', newColor);
      return '#'+newColor.getHexString();
    }
    const startStopEl = startStopButton.current;
    const startStopOrigColor = startStopEl.getAttribute('color');
    const startStopDarkColor = darkColor(startStopOrigColor);
    const handleClick = startStopEl ? (evt) => {
      console.debug('start/stop button clicked! event:', evt);
      console.log('start/stop clicked!', evt);
      if (!startStopRef.current) {
        workerRef.current?.postMessage({type: 'start'});
        startStopEl.setAttribute('color', startStopDarkColor);
        console.log('### start/stop: started. color: ', startStopDarkColor);
        startStopRef.current = true;
      } else {
        workerRef.current?.postMessage({type: 'stop'});
        startStopEl.setAttribute('color', startStopOrigColor);
        console.log('### start/stop: stopped. color: ', startStopOrigColor);
	startStopRef.current = false;
      }
    } : null;
    startStopEl?.addEventListener('click',handleClick);

    const stepEl = stepButton.current;
    const stepOrigColor = stepEl.getAttribute('color');
    const stepDarkColor = darkColor(stepOrigColor);
    const handleStepClick = stepEl ? (evt) => {
      console.debug('Step button clicked! ', evt);
      workerRef.current?.postMessage({type: 'step'});
    } : null;
    stepEl?.addEventListener('click',handleStepClick);
    const stepDownHandler = stepEl ? (evt) => {
      stepEl.setAttribute('color', stepDarkColor);
    } : null;
    const stepUpHandler = stepEl ? (evt) => {
      stepEl.setAttribute('color', stepOrigColor);
    } : null;
    stepEl?.addEventListener('mousedown', stepDownHandler);
    stepEl?.addEventListener('mouseup', stepUpHandler);
    stepEl?.addEventListener('triggerdown', stepDownHandler);
    stepEl?.addEventListener('triggerup', stepUpHandler);

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
