import AFRAME from 'aframe';
import {updateColor} from './colorUtils.js';
import {registerResetTarget} from './attachToAnother.js';
import {numberToEl} from './reflectCollision.js';

AFRAME.registerComponent('reflect-joint-limits', {
  schema: {
    upperColor: {type: 'string', default: 'red'},
    lowerColor: {type: 'string', default: 'blue'},
  },
  init: function () {
    registerResetTarget(this);
    this.colored = false;
  },
  // **** tick ****
  tick: function() {
    if (this.el.workerData?.current?.status && this.el.axes) {
      const limitedStatus = this.el.workerData.current?.status?.limit_flag;
      if (limitedStatus) {
	if (limitedStatus.length === this.el.axes.length) {
	  let colored = false;
	  limitedStatus.forEach((flag, idx) => {
	    if (flag === 0 && !this.colored) return; // skip processing
	    const linkEl = numberToEl(idx + 1, this.el);
	    for (let j = 0; j < linkEl?.children?.length; j++) {
	      const visualEl = linkEl.children[j];
	      if (visualEl.classList.contains('visual') &&
		  visualEl.hasAttribute('gltf-model')) {
		if (flag >= 1) {
		  updateColor(visualEl, this.data.upperColor);
		  colored = true;
		} else if (flag <= -1) {
		  updateColor(visualEl, this.data.lowerColor);
		  colored = true;
		} else {
		  updateColor(visualEl, 'original');
		}
	      }
	    }
	  });
	  this.colored = colored;
	}
      }
    }
  },
});
