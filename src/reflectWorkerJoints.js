// Don't import 'three' directly.
// Please use the AFRAME.THREE to setRotationFromAxisAngle
// instead of the THREE.js one.
import AFRAME from 'aframe';

// AFRAME.registerComponent('set-joints-directly-in-degree', {
AFRAME.registerComponent('set-joints-directly-in-degree', {
  schema: { type: 'array'},
  init: function() {
    const robotId = this.el.id;
    // const jointValues = this.data.map((j)=>parseFloat(j)/180.0*Math.PI);
    const jointValues = this.data.map((j)=>parseFloat(j));
    this.el.addEventListener('robot-dom-ready', () => {
      const robotRegistry = this.el.sceneEl?.robotRegistryComp;
      if (robotRegistry) {
	const axesList = robotRegistry.get(robotId)?.axes;
	if (axesList) {
	  axesList.map((axisEl, idx)=> {
            const axis = axisEl.axis;
            axisEl.object3D.setRotationFromAxisAngle(axis,
						     jointValues[idx]);
	  });
	  return; // SUCCEED
	}
      }
    }, {once: true});
  }		       
});

AFRAME.registerComponent('reflect-worker-joints', {
  init: function () {
    this.workerDataJointsReady = false;
    this.el.addEventListener('ik-worker-start', () => {
      const robotId = this.el.id;
      let checkCount = 0;
      const checkWorkerJoints = () => {
	const jointData = this.el.workerData.current.joints;
	if (jointData) { // not equal NULL?
	  // this.el.workerData.current.joints should be exist,
	  // but may be null
	  const robotRegistry = this.el.sceneEl.robotRegistryComp;
	  // console.warn('workerData.joints type:',
	  // 	       typeof jointData,
	  // 	       'data:', jointData);
	  // console.warn('robotRegistryComp:',robotRegistry);
	  // console.warn('robotId:', robotId);
	  // console.warn('get:', robotRegistry.get(robotId));
	  this.axesList = robotRegistry.get(robotId)?.axes;
	  if (this.axesList) { // exists?
	    if (this.axesList.length === jointData.length) {
	      // SUCCEED
	      this.workerDataJointsReady = true;
	      return;
	    } else {
              console.warn('length mismatch. axesList:', this.axesList,
			   ' jointData:', jointData);
	    }
	  } else {
	    console.warn('axesList cannot be found.',
			 'it may not have been registered yet.');
	  }
	} else {
	  // The worker hasn't started working yet
	}
	checkCount++;
	setTimeout(checkWorkerJoints, 500);
      };
      checkWorkerJoints();
      console.warn('workerDataJointsReady:', this.workerDataJointsReady);
    }, {once: true});
  },

  // **** tick ****
  tick: function() {
    if (this?.workerDataJointsReady) { 
      const jointData = this.el.workerData.current.joints;
      this.axesList.map((axisEl, idx)=> {
        // if necessary, you can verify the class 'axis'.
        const axis = axisEl.axis; // this type is THREE.Vector3
        axisEl.object3D.setRotationFromAxisAngle(axis,
						 jointData[idx] /*radian*/);
      });
    }
  }
});
