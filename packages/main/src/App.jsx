// import React, { useEffect, useRef, useState } from 'react'
import 'aframe'
import VrControllerComponents from './VrControllerComponents.jsx'
import ButtonUI from './ButtonUI.jsx'
import './App.css'

// ****************
// the entry point
// :
function App() {
  return (
    <>
      <a-scene update-objects-poses>
        <a-entity camera position="0 1.6 2.0" look-controls="enabled: false"></a-entity>
        <VrControllerComponents />
        <ButtonUI />
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
