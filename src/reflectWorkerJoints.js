import {customLogger} from './customLogger.js'
globalThis.__customLogger = customLogger;
// Don't import 'three' directly.
// Please use the AFRAME.THREE to setRotationFromAxisAngle
// instead of the THREE.js one.
import AFRAME from 'aframe';
import {registerResetTarget} from './attachToAnother.js';

setJointDirectlyComponent({name: 'set-joints-directly-in-degree',
			   unit:  Math.PI/180});
setJointDirectlyComponent({name: 'set-joints-directly',
			   unit:  1.0});

function setJointDirectlyComponent({name, unit}) {
  AFRAME.registerComponent(name, {
    schema: { type: 'array'},
    init: function() {
      const robotId = this.el.id;
      const jointValues = this.data.map((j)=>parseFloat(j)*unit);
      this.el.addEventListener('robot-registered', () => {
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
}

AFRAME.registerComponent('reflect-worker-joints', {
  init: function () {
    registerResetTarget(this);
  },
  // **** tick ****
  tick: function() {
    if (this.el.workerData?.current?.joints) {
      const jointData = this.el.workerData.current.joints;
      this.el.axes.map((axisEl, idx)=> {
        // if necessary, you can verify the class 'axis'.
        const axis = axisEl.axis; // this type is THREE.Vector3
        axisEl.object3D.setRotationFromAxisAngle(axis,
						 jointData[idx] /*radian*/);
      });
    }
  }
});

AFRAME.registerComponent('exact_solution', {
  schema: {
    exact: { type: 'boolean', default: false }
  },
  // postMessage { type: 'set_exact_solution', exactSolution: boolean }
  update: function () {
    const send_exact_solution = () => {
      if (this.el.workerRef?.current) {
	this.el.workerRef.current.postMessage({
	  type: 'set_exact_solution',
	  exactSolution: this.data.exact
	});
      }
    };
    if (this.el.ikWorkerReady) {
      send_exact_solution();
    } else {
      this.el.addEventListener('ik-worker-ready', send_exact_solution,
			       {once: true});
    }
  }
});
