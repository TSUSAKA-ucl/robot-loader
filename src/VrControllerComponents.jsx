// ********
// ********
import AFRAME from 'aframe';
import './vrControllerThumbMenu.js'; // with thumbMenuEventHandler
import './rapierSelector.js';
import './axesFrame.js';


export default VrControllerComponents;

function VrControllerComponents() {
  const menuItems = "nova2-plane,act,rapier,deact,jaka-plane,open,ray,close";

  return (
    <>
      <a-entity right-controller
                laser-controls="hand: right"
                raycaster="objects: .clickable"
                line="color: blue; opacity: 0.75"
                thumbstick-menu={`items: ${menuItems}`}
                thumbmenu-event-handler
                target-selector
                rapier-selector
                visible="true">
        <a-entity a-axes-frame />
      </a-entity>
      <a-entity cursor="rayOrigin: mouse"
                mouse-cursor
                raycaster="objects: .clickable"></a-entity>

    </>
  );
}
