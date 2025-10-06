// ********
// DO NOT IMPORT THIS FILE FROM MULTIPLE LOCATIONS
// This file defines A-Frame components for VR controller handling directly
// in the main thread, so it should be imported only once.
// ********
import AFRAME from 'aframe'
const THREE = window.AFRAME.THREE;
import {globalWorkerRef, globalObjectsRef} from '@ucl-nuee/rapier-worker'
import './vrControllerThumbMenu.js';
import './vrControllerMotionUI.js';
import './thumbMenuEventHandler.js';

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
                thumbstick-menu="items: A,B,C,D,E,F,G,H"
                thumbmenu-event-hander
                motion-controller
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
