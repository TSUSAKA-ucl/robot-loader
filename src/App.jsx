import { useState } from 'react';
import './App.css';
import 'aframe';
import '@ucl-nuee/robot-loader/armMotionUI.js';
import '@ucl-nuee/robot-loader/axesFrame.js';
import '@ucl-nuee/robot-loader/reflectWorkerJoints.js';
import '@ucl-nuee/robot-loader/robotLoader.js';
import '@ucl-nuee/robot-loader/robotRegistry.js';
import '@ucl-nuee/robot-loader/vrControllerThumbMenu.js';

function App() {
  const menuItems = "nova2-plane,-,-,-,jaka-plane,-,ray,-";
  const deg30 = Math.PI / 6.0;
  const deg90 = Math.PI/2;
  const deg45 = Math.PI/4;
  const deg22 = Math.PI/8;

  return (
    <a-scene xr-mode-ui="XRMode: ar">
      <a-entity id="robot-registry"
                robot-registry>
        <a-entity right-controller
                  laser-controls="hand: right"
                  raycaster="objects: .clickable"
                  line="color: blue; opacity: 0.75"
                  thumbstick-menu={`items: ${menuItems}`}
                  thumbmenu-event-handler
                  event-distributor
                  target-selector
                  visible="true">
          <a-entity a-axes-frame />
        </a-entity>
        <a-entity left-controller
                  laser-controls="hand: left"
                  thumbstick-menu={`items: ${menuItems}`}
                  thumbmenu-event-handler
                  event-distributor
                  target-selector
                  visible="true">
          <a-entity a-axes-frame />
        </a-entity>
        <a-entity cursor="rayOrigin: mouse"
                  mouse-cursor
                  raycaster="objects: .clickable"></a-entity>
      </a-entity>
      <a-entity camera position="-0.5 1.2 1.7"
                look-controls="enabled: true"></a-entity>

      <a-plane id="jaka-plane"
               robot-loader="model: jaka_zu_5"
               position="0 0.1 -1.25" rotation="-90 0 90"
               width="2" height="2" color="lightcoral"
               material="opacity: 0.15; transparent: true; side: double;"
               reflect-worker-joints
               arm-motion-ui
      />
      <a-plane id="nova2-plane"
	       position="-1.0 0.0 -1.0" rotation="-90 0 90"
	       width="2" height="2" color="beige"
	       material="opacity: 0.15; transparent: true; side: double;"
               robot-loader="model: nova2_robot"
               reflect-worker-joints
               arm-motion-ui
      />
      {/* <a-sky color="#ECECEC"></a-sky> */}
    </a-scene>
  );
}

export default App;
