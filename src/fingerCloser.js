import AFRAME from 'aframe';
import {registerResetTarget} from './attachToAnother.js';

AFRAME.registerComponent('finger-closer', {
  schema: {
    openEvent: {type: 'string', default: 'bbuttondown'},
    openStopEvent: {type: 'string', default: 'bbuttonup'},
    openSpeed: {type: 'number', default: 0.5}, // radian per second
    openMax: {type: 'number', default: 0}, // in degrees
    closeEvent: {type: 'string', default: 'abuttondown'},
    closeStopEvent: {type: 'string', default: 'abuttonup'},
    closeSpeed: {type: 'number', default: 0.5},// radian per second
    closeMax: {type: 'number', default: 44}, // in degrees
    stationaryJoints: {type: 'array', default: []}, // indices of joints that do not move
    interval: {type: 'number', default: 0.1}, // seconds
    debugTick: {type: 'boolean', default: false},
  },
  init: function() {
    console.debug('event-forwarder: finger-close init component.data:',this.data);
    const onLoading = () => {
      this.start = Date.now();
      this.interval = this.data.interval;
      this.intervalTimer = null;
      this.opening = false;
      this.closing = false;
      this.openMaxRadian = this.data.openMax*Math.PI/180.0;
      this.closeMaxRadian = this.data.closeMax*Math.PI/180.0;
      this.stationaryJoints = this.data.stationaryJoints.map((i) => parseInt(i));
      if (this.closeMaxRadian >= this.openMaxRadian) {
	this.openDirection = 1;
      } else {
	this.openDirection = -1;
      }
      this.el.addEventListener(this.data.openEvent, () => {
	console.debug('open event received by:', this.el.id);
	console.debug('schema:', this.data);
	this.opening = true;
	this.closing = false;
      });
      this.el.addEventListener(this.data.openStopEvent, () => {
	console.debug('open stop event received by:', this.el.id);
	console.debug('schema:', this.data);
	this.opening = false;
      });
      this.el.addEventListener(this.data.closeEvent, () => {
	console.debug('close event received by:', this.el.id);
	this.closing = true;
	this.opening = false;
      });
      this.el.addEventListener(this.data.closeStopEvent, () => {
	console.debug('close stop event received by:', this.el.id);
	this.closing = false;
	if (this.data?.debugTick) this.data.debugTick = false;
      });
      console.debug('event-forwarder: before register component.data:',this.data);
      registerResetTarget(this);
    };
    if (this.el.hasLoaded) {
      onLoading();
    } else {
      this.el.addEventListener('loaded', onLoading, {once: true});
    }
  },
  remove: function() {
  },
  tick: function(time, timeDelta) {
    // console.debug('finger-closer loop:',this?.el?.id,' in axesUpdate', Date.now()-this?.start);
    if (this.el?.realAxes) {
      if (this.debugTime < 3000) {
	this.debugTime += timeDelta;
      } else {
	this.debugTime = 0;
      }
      if (this?.jointValues === undefined) {
	this.jointValues = Array(this.el.realAxes.length).fill(0);
	// console.debug('finger-closer: Initialized jointValues for',
	// 	     this.el.id, this.jointValues);
      } else {
	if (this.opening || this.closing) {
	  const jointValues = this.jointValues;
	  const deltaRadianOpen = (this.data.openSpeed * this.interval);
	  const deltaRadianClose = (this.data.closeSpeed * this.interval);
	  for (let i = 0; i < jointValues.length; i++) {
	    if (!this.stationaryJoints.includes(i)) {
	      // console.debug(`joint ${i} value before: ${jointValues[i]}`);
	      if (this.closing) {
		// console.debug('finger-closer:',this.el.id,Date.now()-this.start,
		// 	      ' closing joint',i, 'value:', jointValues[i]);
		if (this.openDirection * (jointValues[i] - this.closeMaxRadian) < 0) {
		  jointValues[i] += this.openDirection * deltaRadianClose;
		} else {
		  jointValues[i] = this.closeMaxRadian; // limit
		}
	      }
	      if (this.opening) {
		// console.debug('finger-closer:',this.el.id,Date.now()-this.start,
		// 	      ' opening joint',i, 'value:', jointValues[i]);
		if (this.openDirection * (jointValues[i] - this.openMaxRadian) > 0) {
		  jointValues[i] -= this.openDirection * deltaRadianOpen;
		} else {
		  jointValues[i] = this.openMaxRadian; // limit
		}
	      }
	    }
	  }
	  this.jointValues = jointValues;
	}
	if (this.jointValues) {
	  this.el.realAxes.map((realAxis, idx) => {
	    if (this.debugTime < 16) {
	      console.debug('finger-closer:',realAxis.type,'joint',idx);
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
		console.debug('finger-closer:',this.el.id,Date.now()-this.start,
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
  }
});
