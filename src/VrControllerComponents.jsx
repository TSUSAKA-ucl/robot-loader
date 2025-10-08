// ********
// ********
import AFRAME from 'aframe'
import './vrControllerThumbMenu.js'; // with thumbMenuEventHandler

export default VrControllerComponents;

// let controllerPosition = null;
// let controllerQuaternion = null;

AFRAME.registerComponent('right-controller-frame', {
  init() {
    this.el.parentNode.frameObject3D = this.el.object3D;
  // },
  // tick() {
  //   if (controllerPosition && controllerQuaternion) {
  //     this.el.object3D.position.copy(controllerPosition);
  //     this.el.object3D.quaternion.copy(controllerQuaternion);
  //   }
  }
});

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
                thumbmenu-event-handler
                visible="true">
        {controller_axes}
      </a-entity>
      <a-entity cursor="rayOrigin: mouse"
                mouse-cursor
                raycaster="objects: .clickable"></a-entity>

    </>
  );
}
//                 oculus-touch-controls="hand: right"
