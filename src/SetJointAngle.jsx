// Please use the AFRAME.THREE setRotationFromAxisAngle
// instead of the THREE.js one.
import AFRAME from 'aframe';

AFRAME.registerComponent('robot-set-joint', {
  schema: {
    robotId: {type: 'string', default: ''},
    workerData: {default: null},
  },
  init: function () {
    console.log('robot-set-joint initialzed.');
    if (this.el.workerData) {
      console.log('**** workerData:', this.el.workerData, '****');
    }
    if (this.data.workerData) {
      console.log('**** workerData:', this.data.workerData, '****');
    }
    if (this.el.data?.workerData) {
      console.log('**** el.data.workerData:', this.el.data.workerData, '****');
    }
  },
  tick: function () {
    if (!this.data.workerData?.current) {
      console.warn('workerData not ready yet.');
      return;
    }
    if (!this.data.robotId) {
      console.error('robotId not set.');
      return;
    }
    const robotRegistry = document.getElementById('robot_registry');
    const robotId = this.data.robotId;
    const jointData = this.data.workerData?.current?.joints;
    if (robotRegistry) {
      // console.log('robot_registry found');
      if (robotRegistry.hasLoaded) {
        const axesList = robotRegistry.components['robot-registry'].get(robotId);
        // console.log('robot_registry loaded. robotId:', robotId,
        //             ' axesList: ', axesList);
        if (axesList && axesList.length === jointData.length) {
          axesList.map((axisEl, idx)=> {
            // verify class 'axis' 
            const axis = axisEl.axis;
            axisEl.object3D.setRotationFromAxisAngle(axis, jointData[idx] /*radian*/);
          });
        } else {
          console.warn('axiesList not found or length mismatch. axesList:', axesList,
                       ' jointData:', jointData);
        }
      } else {
	console.warn('robot_registry not loaded yet.');
      }
    }
  }
});
