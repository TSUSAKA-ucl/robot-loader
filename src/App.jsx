// import React, { useEffect, useRef, useState } from 'react'
import { useRef,useEffect } from 'react';
import './App.css';
import 'aframe';
import './robotRegistry.js';// registers the robot-registry and event-distributor AFrame components
import VrControllerComponents from './VrControllerComponents.jsx';
// VrControllerComponents also registers the vr-controller-right AFrame component
import ButtonUI from './ButtonUI.jsx';
import './rapierBoxController.js'; // registers the rapier-box-controller AFrame component
import './rapierHand1MotionUI.js'; // registers the rapier-hand1-motion-ui AFrame component
import LoadUrdf from './LoadUrdf.jsx';
import './robotSetJoint.js'; // registers the robot-set-joint AFrame component

// ****************
// the entry point
// :
function App() {
  const deg30 = Math.PI / 6.0;
  const deg90 = Math.PI/2;
  // const deg45 = Math.PI/4;
  const jakaWorkerData = useRef({joints: [Math.PI/8, deg30, -deg30, 0, -deg90, 0]});
  const novaWorkerData = useRef({joints: [Math.PI/8, -deg90, deg90, 0, -deg90, 0]});
  const sceneRef = useRef(null);
  useEffect(() => {
    const sceneEl = sceneRef.current;
    if (sceneEl) {
      const onSceneLoaded = () => {
	console.log('### scene loaded');
	// any additional setup after scene is loaded can go here
        const robotRegistryComp = sceneEl.robotRegistryComp;
        console.log('******** robotRegistryComp:', robotRegistryComp);
        if (robotRegistryComp) {
          robotRegistryComp.enableEventDelivery('rapier-controller');
          console.log('rapier-controller event delivery enabled:',
                      robotRegistryComp.eventDeliveryEnabled('rapier-controller'));
          console.log('robotRegistry list:', robotRegistryComp.list());
	}
      };
      if (sceneEl.hasLoaded) {
	onSceneLoaded();
      } else {
	sceneEl.addEventListener('loaded', onSceneLoaded);
      }
      return () => {
	sceneEl.removeEventListener('loaded', onSceneLoaded);
      };
    }
  }, []);

  return (
    <a-scene ref={sceneRef} xr-mode-ui="XRMode: ar">
      <a-entity robot-registry event-distributor id="robot_registry">
        <VrControllerComponents />
      </a-entity>
      <a-entity camera position="-0.5 1.2 1.7" look-controls="enabled: false"></a-entity>

      <ButtonUI />
      <a-cylinder position="0.25 0.2 -0.75"
                  radius="0.12" height="0.4" color="#FFC65D"
                  material="opacity: 0.35; transparent: true">
      </a-cylinder>

      <a-entity
        id="rapier-controller"
        rapier-box-controller="robotId: rapier-controller"
        rapier-hand1-motion-ui
      />

      <a-plane id="jaka_plane" position="0 0.5 -1.0" rotation="-90 0 90"
               width="2" height="2" color="lightskyblue"
	       material="opacity: 0.15; transparent: true; side: double;">
      </a-plane>
      <LoadUrdf robotPlane={'jaka_plane'} robotModel={'jaka_zu_5'} />
      <a-entity robot-set-joint="robotId: jaka_plane"
                ref={el => el && el.setAttribute('robot-set-joint',
                                                 {workerData: jakaWorkerData})}
      />

      <a-plane id="nova2_plane" position="1.0 0.5 -1.5" rotation="-90 0 90"
               width="2" height="2" color="lightskyblue"
	       material="opacity: 0.15; transparent: true; side: double;">
        <LoadUrdf robotPlane={'nova2_plane'} robotModel={'nova2_robot'} />
      </a-plane>
      <a-entity robot-set-joint="robotId: nova2_plane"
                ref={el => el && el.setAttribute('robot-set-joint',
                                                 {workerData: novaWorkerData})}
      />
      <a-sky color="#ECECEC"></a-sky>
    </a-scene>
  )
}

export default App
