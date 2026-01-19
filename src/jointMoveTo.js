import AFRAME from 'aframe';

AFRAME.registerComponent('joint-move-to', {
  schema: { type: 'array'}, // target angles in radian
  init: function() {
    this.jointTargets = this.data.map(parseFloat);
    this.setJointTarget = (targets) => {
      if (this.el.workerData?.current?.joints?.length === targets.length) {
	if (this.el.workerRef?.current) {
	  this.el.workerRef.current.postMessage({
	    type: 'set_joint_targets',
	    jointTargets: targets
	  });
	}
      }
    };
    this.done = false;
  },
  update: function() {
    this.jointTargets = this.data.map(parseFloat);
    this.done = false;
    this.time = 0;
  },
  tick: function(step) {
    this.time += step;
    if (this.time > 1000000) {
      console.log('joint-move-to joints:',
		  this.el.workerData?.current?.joints);
      console.log('joint-move-to tick status:',
		  this.el.workerData.current?.status?.status);
      this.time = 0;
    }
    if (!this.done) {
      if (this.el.workerData?.current?.joints) {
	if (this.el.workerData.current?.status?.status === 'END') {
	  this.setJointTarget(this.jointTargets);
	  this.done = true;
	}
      }
    }
  }
});
