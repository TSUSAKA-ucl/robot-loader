// import React, { useEffect, useRef, useState } from 'react'
import { useRef } from 'react'
import './App.css'
import 'aframe'
import VrControllerComponents from './VrControllerComponents.jsx'
// VrControllerComponents also registers the laser-controller-right AFrame component
// and the vr-controller-right AFrame component
import ButtonUI from './ButtonUI.jsx'
import LoadUrdf from './LoadUrdf.jsx' // this also registers the robot-registry AFrame component
import './SetJointAngle.jsx'

// ****************
// the entry point
// :
function App() {
  const workerData = useRef({joints: null});
  const deg30 = Math.PI / 6.0;
  const deg90 = Math.PI/2;
  const deg45 = Math.PI/4;
  workerData.current.joints = [Math.PI/8, deg30, -deg30, 0, -deg90, 0];

  const novaWorkerData = useRef({joints: null});
  novaWorkerData.current.joints = [Math.PI/8, -deg90, deg90, 0, -deg90, 0];

  return (
    <>
      <a-scene update-objects-poses>
        <a-entity robot-registry id="robot_registry" />
        <a-entity camera position="-0.5 1.2 1.7" look-controls="enabled: false"></a-entity>
        <VrControllerComponents />
        <ButtonUI />
        <a-cylinder position="0.25 0.2 -0.75"
                    radius="0.12" height="0.4" color="#FFC65D"
                    material="opacity: 0.35; transparent: true">
        </a-cylinder>

        <a-plane id="jaka_plane" position="0 0.5 -1.0" rotation="-90 0 90"
                 width="2" height="2" color="lightskyblue"
		 material="opacity: 0.15; transparent: true; side: double;">
        </a-plane>
        <LoadUrdf robotPlane={'jaka_plane'} robotModel={'jaka_zu_5'} />
        <a-entity robot-set-joint="robotId: jaka_plane"
                  ref={el => el && el.setAttribute('robot-set-joint',
                                                   {workerData: workerData})}
          />

        <a-plane id="nova2_plane" position="1.0 0.5 -1.5" rotation="-90 0 90"
                 width="2" height="2" color="lightskyblue"
		 material="opacity: 0.15; transparent: true; side: double;">
        </a-plane>
        <LoadUrdf robotPlane={'nova2_plane'} robotModel={'nova2_robot'} />
        <a-entity robot-set-joint="robotId: nova2_plane"
                  ref={el => el && el.setAttribute('robot-set-joint',
                                                   {workerData: novaWorkerData})}
          />
        <a-sky color="#ECECEC"></a-sky>
      </a-scene>
    </>
  )
}

export default App
