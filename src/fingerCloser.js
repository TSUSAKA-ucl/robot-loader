import AFRAME from 'aframe';
import {registerResetTarget} from '@ucl-nuee/robot-loader/attachToAnother.js';

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
  },
  init: function() {
    console.log('event-forwarder: finger-close init component.data:',this.data);
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
	console.log('open event received by:', this.el.id);
	console.log('schema:', this.data);
	this.opening = true;
	this.closing = false;
      });
      this.el.addEventListener(this.data.openStopEvent, () => {
	console.log('open stop event received by:', this.el.id);
	console.log('schema:', this.data);
	this.opening = false;
      });
      this.el.addEventListener(this.data.closeEvent, () => {
	console.log('close event received by:', this.el.id);
	this.closing = true;
	this.opening = false;
      });
      this.el.addEventListener(this.data.closeStopEvent, () => {
	console.log('close stop event received by:', this.el.id);
	this.closing = false;
      });
      console.log('event-forwarder: before register component.data:',this.data);
      registerResetTarget(this);
    };
    if (this.el.hasLoaded) {
      onLoading();
    } else {
      this.el.addEventListener('loaded', onLoading, {once: true});
    }
    // if (!(this.el.resetTargets && Array.isArray(this.el.resetTargets))) {
    //   this.el.resetTargets = [];
    // }
    // this.el.resetTargets.push({
    //   name: 'finger-closer',
    //   defaultValue: {openEvent: this.data.openEvent,
    // 		     openStopEvent: this.data.openStopEvent,
    // 		     openSpeed: this.data.openSpeed,
    // 		     openMax: this.data.openMax,
    // 		     closeEvent: this.data.closeEvent,
    // 		     closeStopEvent: this.data.closeStopEvent,
    // 		     closeSpeed: this.data.closeSpeed,
    // 		     closeMax: this.data.closeMax,
    // 		     stationaryJoints: this.data.stationaryJoints,
    // 		     interval: this.data.interval}
    // });
  },
  remove: function() {
  },
  tick: function(time, timeDelta) {
    // console.warn('finger-closer loop:',this?.el?.id,' in axesUpdate', Date.now()-this?.start);
    if (this.el?.axes) {
      if (this?.jointValues === undefined) {
	this.jointValues = Array(this.el.axes.length).fill(0);
	console.log('finger-closer: Initialized jointValues for',this.el.id, this.jointValues);
      } else {
	if (this.opening || this.closing) {
	  const jointValues = this.jointValues;
	  const deltaRadianOpen = (this.data.openSpeed * this.interval);
	  const deltaRadianClose = (this.data.closeSpeed * this.interval);
	  for (let i = 0; i < jointValues.length; i++) {
	    if (!this.stationaryJoints.includes(i)) {
	      // console.log(`joint ${i} value before: ${jointValues[i]}`);
	      if (this.closing) {
		// console.log('finger-closer:',this.el.id,Date.now()-this.start,
		// 	      ' closing joint',i, 'value:', jointValues[i]);
		if (this.openDirection * (jointValues[i] - this.closeMaxRadian) < 0) {
		  jointValues[i] += this.openDirection * deltaRadianClose;
		} else {
		  jointValues[i] = this.closeMaxRadian; // limit
		}
	      }
	      if (this.opening) {
		// console.log('finger-closer:',this.el.id,Date.now()-this.start,
		// 	      ' opening joint',i, 'value:', jointValues[i]);
		if (this.openDirection * (jointValues[i] - this.openMaxRadian) > 0) {
		  jointValues[i] -= this.openDirection * deltaRadianOpen;
		} else {
		  jointValues[i] = this.openMaxRadian; // limit
		}
	      }
	    }
	  }
	  this.el.axes.map((axisEl, idx) => {
	    const axis = axisEl.axis;
	    axisEl.object3D.setRotationFromAxisAngle(axis,
						     jointValues[idx]);
	  });
	}
      }
    }
  }
});
