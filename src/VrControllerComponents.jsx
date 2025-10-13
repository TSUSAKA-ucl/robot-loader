// ********
// ********
import AFRAME from 'aframe'
import './vrControllerThumbMenu.js'; // with thumbMenuEventHandler
import './targetSelector.js';
import './axesFrame.js';


export default VrControllerComponents;

function VrControllerComponents() {
  const menuItems = "nova,act,hand,deact,jaka,open,ray,close";

  return (
    <>
      <a-entity right-controller
                laser-controls="hand: right"
                raycaster="objects: .clickable"
                line="color: blue; opacity: 0.75"
                thumbstick-menu={`items: ${menuItems}`}
                thumbmenu-event-handler
                target-selector
                visible="true">
        <a-entity a-axes-frame
                  add-frameObject3D
        />
      </a-entity>
      <a-entity cursor="rayOrigin: mouse"
                mouse-cursor
                raycaster="objects: .clickable"></a-entity>

    </>
  );
}
