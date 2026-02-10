import {customLogger} from './customLogger.js'
globalThis.__customLogger = customLogger;
import AFRAME from 'aframe';

AFRAME.registerComponent('joint-move-to', {
  schema: {
    default: [],
    parse: function(value) {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return value.split(',').map(Number);
      return [];
    },
  }, // target angles in radian
  init: function() {
    this.setJointTarget = (targets) => {
      if (this.el.workerData?.current?.joints?.length === targets.length) {
	if (this.el.workerRef?.current) {
	  this.el.workerRef.current.postMessage({
	    type: 'set_joint_targets',
	    jointTargets: targets
	  });
	} else {
	  globalThis.__customLogger.error('workerRef is not available');
	}
      } else {
	globalThis.__customLogger.error('Length of joint targets does not match number of joints');
	globalThis.__customLogger.error(`Expected ${this.el.workerData?.current?.joints?.length}, but got ${targets.length}`);
      }
    };
    this.done = false;
  },
  update: function() {
    this.jointTargets = this.data;
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
