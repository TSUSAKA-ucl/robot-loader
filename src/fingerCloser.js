import {customLogger} from './customLogger.js'
globalThis.__customLogger = customLogger;
import AFRAME from 'aframe';
import {registerResetTarget} from './attachToAnother.js';

// schema引数の文字列を、カンマセパレートの数値のarrayにparseする関数
function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map(Number);
  return [0];
}

registerFingerCloser({name: 'finger-closer', useIkWorkerP: false});
registerFingerCloser({name: 'finger-closer2', useIkWorkerP: true});

function registerFingerCloser({name, useIkWorkerP}) {
AFRAME.registerComponent(name, {
  schema: {
    initialJointValues: {parse: parseArray, default: [0]}, // in degrees
    openEvent: {type: 'string', default: 'bbuttondown'},
    openStopEvent: {type: 'string', default: 'bbuttonup'},
    openSpeed: {parse: parseArray, default: [0.5]}, // radian per second
    openMax: {parse: parseArray, default: [0]}, // in degrees
    closeEvent: {type: 'string', default: 'abuttondown'},
    closeStopEvent: {type: 'string', default: 'abuttonup'},
    closeSpeed: {parse: parseArray, default: [0.5]},// radian per second
    closeMax: {parse: parseArray, default: [44]}, // in degrees
    stationaryJoints: {type: 'array', default: []}, // indices of joints that do not move
    interval: {type: 'number', default: 0.1}, // seconds
    debugTick: {type: 'boolean', default: false},
  },
  init: function() {
    globalThis.__customLogger?.debug('event-forwarder: finger-close init component.data:',this.data);
    this.onLoading = () => {
      this.start = Date.now();
      this.interval = this.data.interval;
      this.intervalTimer = null;
      this.opening = false;
      this.closing = false;
      this.jointValues = this.data.initialJointValues.map((deg) => deg*Math.PI/180.0);
      this.openMaxRadian = this.data.openMax.map((deg) => deg*Math.PI/180.0);
      this.closeMaxRadian = this.data.closeMax.map((deg) => deg*Math.PI/180.0);
      this.stationaryJoints = this.data.stationaryJoints.map((i) => parseInt(i));

      this.el.addEventListener(this.data.openEvent, () => {
	globalThis.__customLogger?.debug('open event received by:', this.el.id);
	globalThis.__customLogger?.debug('schema:', this.data);
	this.opening = true;
	this.closing = false;
      });
      this.el.addEventListener(this.data.openStopEvent, () => {
	globalThis.__customLogger?.debug('open stop event received by:', this.el.id);
	globalThis.__customLogger?.debug('schema:', this.data);
	this.opening = false;
      });
      this.el.addEventListener(this.data.closeEvent, () => {
	globalThis.__customLogger?.debug('close event received by:', this.el.id);
	this.closing = true;
	this.opening = false;
      });
      this.el.addEventListener(this.data.closeStopEvent, () => {
	globalThis.__customLogger?.debug('close stop event received by:', this.el.id);
	this.closing = false;
	if (this.data?.debugTick) this.data.debugTick = false;
      });

      globalThis.__customLogger?.debug('event-forwarder: before register component.data:',this.data);
      registerResetTarget(this);
    };
    if (useIkWorkerP) {
      this.setJointTarget = () => {
	const targets = this.jointValues;
	if (this.opening || this.closing) {
	  if (typeof this.el.workerRef?.current?.postMessage === 'function' &&
	      this.el.workerData?.current?.joints?.length === targets.length) {
	    this.el.workerRef.current.postMessage({
	      type: 'set_joint_targets',
	      jointTargets: targets
	    });
	  }
	}
      };
    } else {
      this.setJointTarget = () => {
	if (this.jointValues) {
	  this.el.realAxes.map((realAxis, idx) => {
	    if (this.debugTime < 16) {
	      globalThis.__customLogger?.debug('finger-closer:',realAxis.type,'joint',idx);
	    }
	    let thisJointValue = this.jointValues[idx];
	    if (this.data?.debugTick) {
	      thisJointValue = thisJointValue
		+ 0.1*(this.openMaxRadian - this.closeMaxRadian)
		*Math.sin(Date.now()/100);
	    }
	    if (realAxis.type === 'revolute') {
	      const axisEl = realAxis.el;
	      const axis = axisEl.axis;
	      axisEl.object3D.setRotationFromAxisAngle(axis,
						     thisJointValue);
	    } else if (realAxis.type === 'prismatic') {
	      if (this.debugTime < 16) {
		globalThis.__customLogger?.debug('finger-closer:',this.el.id,Date.now()-this.start,
			      ' prismatic joint',idx, 'value:', thisJointValue,
			      'axis:', realAxis.el.axis);
	      }
	      const axisEl = realAxis.el;
	      const axis = realAxis.el.axis;
	      axisEl.object3D.position.set(axis.x * thisJointValue,
					   axis.y * thisJointValue,
					   axis.z * thisJointValue);
	    }
	  });
	}
      }
    }
  },

  update: function() {
    this.arrayInitialized = false;
    if (this.el.hasLoaded) {
      this.onLoading();
    } else {
      this.el.addEventListener('loaded', this.onLoading, {once: true});
    }
  },
  remove: function() {
  },
  tick: function(time, timeDelta) {
    // globalThis.__customLogger?.debug('finger-closer loop:',this?.el?.id,' in axesUpdate', Date.now()-this?.start);
    if (this.el?.realAxes) {
      if (this.debugTime < 3000) {
	this.debugTime += timeDelta;
      } else {
	this.debugTime = 0;
      }
      if (!this.arrayInitialized) {
	if (this.el.realAxes?.length > 0) {
	  for (let i = 0; i < this.el.realAxes.length; i++) {
	    if (this.jointValues[i] === undefined) {
	      this.jointValues[i] = 0;
	      // globalThis.__customLogger?.debug('finger-closer: Initialized jointValues for',
	      // 	     this.el.id, 'joint', i, 'value', this.jointValues[i]);
	    }
	    if (this.openMaxRadian[i] === undefined) this.openMaxRadian[i] = this.openMaxRadian[0];
	    if (this.closeMaxRadian[i] === undefined) this.closeMaxRadian[i] = this.closeMaxRadian[0];
	    if (this.data.openSpeed[i] === undefined) this.data.openSpeed[i] = this.data.openSpeed[0];
	    if (this.data.closeSpeed[i] === undefined) this.data.closeSpeed[i] = this.data.closeSpeed[0];
	  }
	  this.openDirection = Array(this.openMaxRadian.length).fill(1);
	  for (let i = 0; i < this.openMaxRadian.length; i++) {
	    if (this.closeMaxRadian[i] < this.openMaxRadian[i]) {
	      this.openDirection[i] = -1;
	    }
	  }
	  this.arrayInitialized = true;
	}
      } else {
	if (this.opening || this.closing) {
	  const jointValues = this.jointValues;
	  const deltaRadianOpen = this.data.openSpeed.map(s => s * this.interval);
	  const deltaRadianClose = this.data.closeSpeed.map(s => s * this.interval);
	  for (let i = 0; i < jointValues.length; i++) {
	    if (!this.stationaryJoints.includes(i)) {
	      // globalThis.__customLogger?.debug(`joint ${i} value before: ${jointValues[i]}`);
	      if (this.closing) {
		// globalThis.__customLogger?.debug('finger-closer:',this.el.id,Date.now()-this.start,
		// 	      ' closing joint',i, 'value:', jointValues[i]);
		if (this.openDirection[i] * (jointValues[i] - this.closeMaxRadian[i]) < 0) {
		  jointValues[i] += this.openDirection[i] * deltaRadianClose[i];
		} else {
		  jointValues[i] = this.closeMaxRadian[i]; // limit
		}
	      }
	      if (this.opening) {
		// globalThis.__customLogger?.debug('finger-closer:',this.el.id,Date.now()-this.start,
		// 	      ' opening joint',i, 'value:', jointValues[i]);
		if (this.openDirection[i] * (jointValues[i] - this.openMaxRadian[i]) > 0) {
		  jointValues[i] -= this.openDirection[i] * deltaRadianOpen[i];
		} else {
		  jointValues[i] = this.openMaxRadian[i]; // limit
		}
	      }
	    }
	  }
	  this.jointValues = jointValues;
	}
	this.setJointTarget();
      }
    }
  },
});
}
