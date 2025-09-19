// import React, { useEffect, useRef, useState } from 'react'
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
        <a-sky color="#ECECEC"></a-sky>
        <a-entity robot-set-joint robotId="jaka_plane" />
      </a-scene>
    </>
  )
}

export default App
