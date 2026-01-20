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
    if (this.el.workerData?.current?.status?.status === 'END') {
      this.setJointTarget(this.jointTargets);
      this.done = true;
    } else {
      this.el.addEventListener('ik-worker-arrival', () => {
	this.setJointTarget(this.jointTargets);
	this.done = true;
      }, { once: true });
    }
  },
});
