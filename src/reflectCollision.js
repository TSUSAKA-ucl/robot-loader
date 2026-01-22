import AFRAME from 'aframe';
import {updateColor} from './colorUtils.js';
import {registerResetTarget} from './attachToAnother.js';

export function numberToEl(num, el) {
  if (num > 0) { return el.axes[num - 1]; }
  else if (num === 0) {
    // const childLinks = Array.from(el.children).filter(child=>
    // child.classList.contains('link'));
    // if (childLinks.length === 1) {
    //   return childLinks[0];
    // }
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i];
      if (child.classList.contains('link')) {
	return child;
      }
    }
  }
  return null;
}

AFRAME.registerComponent('reflect-collision', {
  schema: {
    color: {type: 'string', default: 'red'},
  },
  init: function () {
    registerResetTarget(this);
  },

  // **** tick ****
  tick: function() {
    if (this.el.workerData?.current?.status) {
      // console.debug('Status: workerData.current.status:',
      // 		    this.el.workerData.current.status);
      const collisionPairs = this.el.workerData.current?.status?.collisions;
      if (collisionPairs) {
      if (collisionPairs.length === 0) {
	if (this.colored) {
	  // restore original colors
	  for (let i = 0; i < this.el.axes.length + 1; i++) {
	    const linkEl = numberToEl(i, this.el);
	    // console.debug('Status: Processing link index:', i,
	    // 	      'link:', linkEl);
	    for (let j = 0; j < linkEl?.children?.length; j++) {
	      const visualEl = linkEl.children[j];
	      console.debug('Status: Restoring original color of visualEl:',
			    visualEl);
	      if (visualEl.classList.contains('visual') &&
		  visualEl.hasAttribute('gltf-model')) {
		updateColor(visualEl, 'original');
	      }
	    }
	  }
	  this.colored = false;
	}
      } else if (collisionPairs.length > 0) {
	const uniqueFlat = [...new Set(collisionPairs.flat(Infinity))];
	console.debug('Status: collisionPairs:', collisionPairs,
		      ' uniqueFlat:', uniqueFlat);
	for (let i = 0; i < this.el.axes.length + 1; i++) {
	  const linkEl = numberToEl(i, this.el);
	  // console.debug('Status: Processing link index:', i,
	  // 	      'link:', linkEl);
	  if (!uniqueFlat.includes(i)) {
	    // non-collision: original color
	    console.debug('Status: No collision on link index:', i,
			  // 'children:', linkEl?.children,
			  'linkEl:', linkEl);
	    for (let j = 0; j < linkEl?.children?.length; j++) {
	      const visualEl = linkEl.children[j];
	      console.debug('Status: Restoring original color of visualEl:',
			    visualEl);
	      if (visualEl.classList.contains('visual') &&
		  visualEl.hasAttribute('gltf-model')) {
		updateColor(visualEl, 'original');
	      }
	    }
	  } else {
	    // collision
	    console.debug('Status: Collision detected on link index:', i,
			  // 'children:', linkEl?.children,
			  ' linkEl:', linkEl);
	    for (let j = 0; j < linkEl?.children?.length; j++) {
	      const visualEl = linkEl.children[j];
	      console.debug('Status: Changing color of visualEl due to collision:',
			    visualEl);
	      if (visualEl.classList.contains('visual') &&
	          visualEl.hasAttribute('gltf-model')) {
		updateColor(visualEl, this.data.color);
		this.colored = true;
	      }
	    }
	  }
	}
      }
      }
    }
  }
});
