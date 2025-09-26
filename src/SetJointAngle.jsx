import AFRAME from 'aframe'
const THREE = window.AFRAME.THREE;

// export default SetJointAngle
// function SetJointAngle() {
//   return (
//     <>
//       <a-entity robot-set-joint robotId="jaka_plane" />
//     </>
//   );
// }

AFRAME.registerComponent('robot-set-joint', {
  init: function () {
    console.log('robot-set-joint initialzed.');
  },
  tick: function () {
    // console.log('robot-set-joint tick called.');
    // const robotId = this.el.robotId;
    const robotId = 'jaka_plane';
    const robotRegistry = document.getElementById('robot_registry');
    if (robotRegistry) {
      // console.log('robot_registry found');
      if (robotRegistry.hasLoaded) {
        const axesList = robotRegistry.components['robot-registry'].get(robotId);
        // console.log('robot_registry loaded. robotId:', robotId,
        //             ' axesList: ', axesList);
        if (axesList && axesList.length > 0) {
          axesList.map((axisEl)=> {
            // verify class 'axis' 
            const axis = axisEl.axis;
            // console.log('is object3D ', axisEl.object3D.isObject3D,
            //             ' type of axisEl is', typeof axisEl);
            const quat = new THREE.Quaternion(0, 0, 0.130526, 0.991445);
            axisEl.object3D.quaternion.copy(quat);
            // axisEl.object3D.setRotationFromAxisAngle(axis, 30*Math.Pi/180);
          });
          // console.log('axes angles are set. length:',axesList.length);
        }
      }
    }
  }
});
