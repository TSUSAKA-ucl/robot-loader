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
import './robotLoader.js'; // register 'robot-loader'&'ik-worker' AFrame comp.
import './reflectWorkerJoints.js'; // register AFrame comp.
// ****************
// the entry point
// :
function App() {
  const sceneRef = useRef(null);
  const registryRef = useRef(null);
  useEffect(() => {
    const sceneEl = sceneRef.current;
    if (sceneEl) {
      const onSceneLoaded = () => {
	console.log('### scene loaded');
	// any additional setup after scene is loaded can go here
        const robotRegistryComp = sceneEl.robotRegistryComp;
        console.log('******** robotRegistryComp:', robotRegistryComp);
        if (robotRegistryComp) {
          // initialize event delivery for rapier-controller
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

  const deg30 = Math.PI / 6.0;
  const deg90 = Math.PI/2;
  const deg45 = Math.PI/4;
  const deg22 = Math.PI/8;
  return (
    <a-scene ref={sceneRef} xr-mode-ui="XRMode: ar">
      <a-entity id="robot-registry"
                ref={registryRef}
                robot-registry
                event-distributor>
        <VrControllerComponents />
      </a-entity>
      <a-entity camera position="-0.5 1.2 1.7"
                look-controls="enabled: false"></a-entity>

      <ButtonUI />
      <a-cylinder position="1.25 0.2 -0.75"
                  radius="0.12" height="0.4" color="#FFC65D"
                  material="opacity: 0.35; transparent: true">
      </a-cylinder>

      <a-entity
        id="rapier-controller"
        rapier-box-controller="robotId: rapier-controller"
        rapier-hand1-motion-ui
      />

      <a-plane id="jaka-plane"
               robot-loader="model: jaka_zu_5"
               set-joints-directly={`${deg22}, ${deg30}, ${-deg45}, 0, ${-deg90}, 0`}
               position="0 0.1 -1.25" rotation="-90 0 90"
               width="2" height="2" color="lightskyblue"
	       material="opacity: 0.15; transparent: true; side: double;"
               ik-worker={`${deg22}, ${deg30}, ${-deg45}, 0, ${-deg90}, 0`}
               reflect-worker-joints
      />
      <a-plane id="nova2-plane"
	       position="-0.7 0.1 -0.5" rotation="-90 0 90"
	       width="2" height="2" color="lightskyblue"
	       material="opacity: 0.15; transparent: true; side: double;"
               robot-loader="model: nova2_robot"
               ik-worker={`${deg90}, ${-deg45}, ${deg45}, 0, ${-deg90}, 0`}
               reflect-worker-joints
      />
      <a-sky color="#ECECEC"></a-sky>
    </a-scene>
  );
}

export default App
